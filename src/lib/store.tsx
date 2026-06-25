"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { calculateSummary, projectFinancials } from "./finance";
import { initialState, seedSettings } from "./seed";
import { createClient, isSupabaseConfigured } from "./supabase/client";
import {
  mapContribution,
  mapMember,
  mapProject,
  mapSettings,
  mapTransaction,
  mapUser,
  mapPoll,
  mapPollOption,
  mapPollVoter,
} from "./supabase/mappers";
import type {
  AppState,
  Contribution,
  Member,
  PaymentMethod,
  Project,
  Settings,
  Summary,
  Transaction,
  UserAccount,
} from "./types";
import { normalizeEmail, today } from "./utils";

type SupabaseClient = ReturnType<typeof createClient>;
type MemberInput = Omit<Member, "id" | "createdAt">;
type ProjectInput = Omit<Project, "id" | "profit" | "loss" | "createdAt">;
type TransactionInput = Omit<
  Transaction,
  "id" | "createdAt" | "createdBy" | "source"
>;

type StoreContextValue = {
  state: AppState;
  summary: Summary;
  currentUser?: UserAccount;
  isReady: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetDemo: () => Promise<void>;
  addMember: (member: MemberInput) => Promise<void>;
  updateMember: (id: string, updates: Partial<MemberInput>) => Promise<void>;
  uploadMemberImage: (id: string, file: File) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  createMonthlyContribution: (
    month: number,
    year: number,
    amount: number,
  ) => Promise<void>;
  updateContribution: (
    id: string,
    updates: Partial<Contribution>,
  ) => Promise<void>;
  allocatePayment: (
    memberId: string,
    amount: number,
    date: string,
    paymentMethod: PaymentMethod,
    note: string,
  ) => Promise<void>;
  addProject: (project: ProjectInput) => Promise<void>;
  updateProject: (id: string, updates: Partial<ProjectInput>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addTransaction: (transaction: TransactionInput) => Promise<void>;
  updateTransaction: (
    id: string,
    updates: Partial<TransactionInput>,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  resetAllTransactions: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  createPoll: (question: string, options: string[], deadline?: string) => Promise<void>;
  closePoll: (id: string) => Promise<void>;
  deletePoll: (id: string) => Promise<void>;
  castVote: (pollId: string, optionId: string) => Promise<void>;
};

const StoreContext = createContext<StoreContextValue | undefined>(undefined);



function cloneInitialState() {
  const cloned = JSON.parse(JSON.stringify(initialState)) as AppState;
  cloned.polls = [];
  cloned.pollOptions = [];
  cloned.pollVoters = [];
  return cloned;
}

function coerceMoney(value: number | undefined) {
  return Math.max(Number(value || 0), 0);
}

function nullableText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function memberPayload(member: Partial<MemberInput>) {
  const payload: Record<string, string | number | null> = {};

  if (member.memberCode !== undefined) {
    payload.member_code = nullableText(member.memberCode);
  }
  if (member.name !== undefined) payload.name = member.name;
  if (member.designation !== undefined) {
    payload.designation = nullableText(member.designation);
  }
  if (member.phone !== undefined) payload.phone = member.phone;
  if (member.email !== undefined) payload.email = normalizeEmail(member.email);
  if (member.nid !== undefined) payload.nid = nullableText(member.nid);
  if (member.bloodGroup !== undefined) {
    payload.blood_group = nullableText(member.bloodGroup);
  }
  if (member.address !== undefined) payload.address = nullableText(member.address);
  if (member.emergencyContactPhone !== undefined) {
    payload.emergency_contact_phone = nullableText(member.emergencyContactPhone);
  }
  if (member.emergencyContactName !== undefined) {
    payload.emergency_contact_name = nullableText(member.emergencyContactName);
  }
  if (member.openingBalance !== undefined) {
    payload.opening_balance = coerceMoney(member.openingBalance);
  }
  if (member.profileImageUrl !== undefined) {
    payload.profile_image_url = nullableText(member.profileImageUrl);
  }
  if (member.joinDate !== undefined) payload.join_date = member.joinDate;
  if (member.status !== undefined) payload.status = member.status;

  return payload;
}

function memberSelfPayload(member: Partial<MemberInput>) {
  const payload: Record<string, string | null> = {};

  if (member.name !== undefined) payload.name = member.name;
  if (member.phone !== undefined) payload.phone = member.phone;
  if (member.nid !== undefined) payload.nid = nullableText(member.nid);
  if (member.bloodGroup !== undefined) {
    payload.blood_group = nullableText(member.bloodGroup);
  }
  if (member.address !== undefined) payload.address = nullableText(member.address);
  if (member.emergencyContactPhone !== undefined) {
    payload.emergency_contact_phone = nullableText(member.emergencyContactPhone);
  }
  if (member.emergencyContactName !== undefined) {
    payload.emergency_contact_name = nullableText(member.emergencyContactName);
  }

  return payload;
}

function projectPayload(project: ProjectInput) {
  const investmentAmount = coerceMoney(project.investmentAmount);
  const expectedReturn = coerceMoney(project.expectedReturn);
  const actualReturn = coerceMoney(project.actualReturn);
  const expense = coerceMoney(project.expense);
  const financials = projectFinancials({
    investmentAmount,
    actualReturn,
    expense,
    status: project.status,
  });

  return {
    name: project.name,
    description: project.description,
    investment_amount: investmentAmount,
    expected_return: expectedReturn,
    actual_return: actualReturn,
    expense,
    profit: financials.profit,
    loss: financials.loss,
    status: project.status,
    start_date: project.startDate,
    end_date: project.endDate || null,
    note: project.note || null,
  };
}

function settingsPayload(settings: Settings) {
  return {
    group_name: settings.groupName,
    currency: settings.currency,
    first_month_contribution: coerceMoney(settings.firstMonthContribution),
    monthly_contribution: coerceMoney(settings.monthlyContribution),
    fund_start_month: settings.fundStartMonth,
    fund_start_year: settings.fundStartYear,
    updated_at: new Date().toISOString(),
  };
}

function autoProjectTransactionPayloads(project: Project, createdBy: string) {
  const date = project.endDate || project.startDate || today();
  const base = {
    project_id: project.id,
    created_by: createdBy,
    source: "auto",
  };
  const rows = [];

  if (project.investmentAmount > 0) {
    rows.push({
      ...base,
      type: "Investment",
      amount: project.investmentAmount,
      date: project.startDate,
      note: project.name,
    });
  }

  if (project.expense > 0) {
    rows.push({
      ...base,
      type: "Project Expense",
      amount: project.expense,
      date,
      note: project.name,
    });
  }

  if (project.actualReturn > 0) {
    rows.push({
      ...base,
      type: "Project Return",
      amount: project.actualReturn,
      date,
      note: project.name,
    });
  }

  if (project.profit > 0) {
    rows.push({
      ...base,
      type: "Profit",
      amount: project.profit,
      date,
      note: project.name,
    });
  }

  if (project.loss > 0) {
    rows.push({
      ...base,
      type: "Loss",
      amount: project.loss,
      date,
      note: project.name,
    });
  }

  return rows;
}

async function getCurrentAppUser(
  supabase: SupabaseClient,
  authId: string,
): Promise<UserAccount | undefined> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", authId)
    .maybeSingle();

  if (error) {
    console.error("Could not load app user", error);
    return undefined;
  }

  return data ? mapUser(data) : undefined;
}

async function loadAppState(
  supabase: SupabaseClient,
  currentUser: UserAccount,
): Promise<AppState> {
  // Temporary cleanup for future unpaid contributions
  if (currentUser?.role === "admin") {
    await supabase
      .from("contributions")
      .delete()
      .eq("paid_amount", 0)
      .or("year.gt.2026,and(year.eq.2026,month.gt.6)");
  }

  const [
    settingsResult,
    usersResult,
    membersResult,
    contributionsResult,
    projectsResult,
    transactionsResult,
    pollsResult,
    pollOptionsResult,
    pollVotersResult,
  ] = await Promise.all([
    supabase.from("settings").select("*").limit(1).maybeSingle(),
    supabase.from("users").select("*").order("created_at", { ascending: true }),
    supabase
      .from("members")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("contributions")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false }),
    supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false }),
    supabase
      .from("polls")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("poll_options")
      .select("*")
      .order("created_at", { ascending: true }),
    supabase
      .from("poll_voters")
      .select("*"),
  ]);

  for (const result of [
    settingsResult,
    usersResult,
    membersResult,
    contributionsResult,
    projectsResult,
    transactionsResult,
    pollsResult,
    pollOptionsResult,
    pollVotersResult,
  ]) {
    if (result.error) {
      console.error("Supabase load error", result.error);
    }
  }

  const users = (usersResult.data ?? []).map(mapUser);
  const hasCurrentUser = users.some((user) => user.id === currentUser.id);

  return {
    users: hasCurrentUser ? users : [currentUser, ...users],
    members: (membersResult.data ?? []).map(mapMember),
    contributions: (contributionsResult.data ?? []).map(mapContribution),
    projects: (projectsResult.data ?? []).map(mapProject),
    transactions: (transactionsResult.data ?? []).map(mapTransaction),
    settings: settingsResult.data ? mapSettings(settingsResult.data) : seedSettings,
    polls: (pollsResult.data ?? []).map(mapPoll),
    pollOptions: (pollOptionsResult.data ?? []).map(mapPollOption),
    pollVoters: (pollVotersResult.data ?? []).map(mapPollVoter),
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(
    () => (isSupabaseConfigured() ? createClient() : undefined),
    [],
  );
  const [state, setState] = useState<AppState>(() => cloneInitialState());
  const [currentUser, setCurrentUser] = useState<UserAccount>();
  const [isReady, setIsReady] = useState(false);
  const isAdmin = currentUser?.role === "admin";

  const refreshData = useCallback(
    async (user = currentUser) => {
      if (!supabase || !user) return;
      const nextState = await loadAppState(supabase, user);
      setState(nextState);
    },
    [currentUser, supabase],
  );

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!supabase) {
        setState(cloneInitialState());
        setIsReady(true);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setCurrentUser(undefined);
        setState(cloneInitialState());
        setIsReady(true);
        return;
      }

      const appUser = await getCurrentAppUser(supabase, user.id);

      if (!active) return;

      if (!appUser) {
        await supabase.auth.signOut();
        setCurrentUser(undefined);
        setState(cloneInitialState());
        setIsReady(true);
        return;
      }

      setCurrentUser(appUser);
      setState(await loadAppState(supabase, appUser));
      setIsReady(true);
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [supabase]);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return false;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });

      if (error || !data.user) {
        console.error("Login failed", error);
        return false;
      }

      const appUser = await getCurrentAppUser(supabase, data.user.id);

      if (!appUser) {
        await supabase.auth.signOut();
        return false;
      }

      setCurrentUser(appUser);
      setState(await loadAppState(supabase, appUser));
      return true;
    },
    [supabase],
  );

  const logout = useCallback(async () => {
    await supabase?.auth.signOut();
    setCurrentUser(undefined);
    setState(cloneInitialState());
  }, [supabase]);

  const resetDemo = useCallback(async () => {
    await refreshData();
  }, [refreshData]);

  const addMember = useCallback(
    async (member: MemberInput) => {
      if (!supabase || !isAdmin) return;

      const { data, error } = await supabase
        .from("members")
        .insert(memberPayload(member))
        .select()
        .single();

      if (error) {
        console.error("Could not add member", error);
        return;
      }

      await supabase.from("users").upsert(
        {
          name: member.name,
          email: normalizeEmail(member.email),
          role: "member",
          member_id: data.id,
        },
        { onConflict: "email" },
      );
      await refreshData();
    },
    [isAdmin, refreshData, supabase],
  );

  const updateMember = useCallback(
    async (id: string, updates: Partial<MemberInput>) => {
      const canUpdateOwnProfile = currentUser?.memberId === id;
      if (!supabase || (!isAdmin && !canUpdateOwnProfile)) return;

      const payload = isAdmin
        ? memberPayload(updates)
        : memberSelfPayload(updates);

      if (Object.keys(payload).length > 0) {
        const { error } = await supabase
          .from("members")
          .update(payload)
          .eq("id", id);

        if (error) {
          console.error("Could not update member", error);
          return;
        }
      }

      if (isAdmin) {
        const userPayload: Record<string, string> = {};
        if (updates.name !== undefined) userPayload.name = updates.name;
        if (updates.email !== undefined) {
          userPayload.email = normalizeEmail(updates.email);
        }

        if (Object.keys(userPayload).length > 0) {
          await supabase.from("users").update(userPayload).eq("member_id", id);
        }
      } else if (updates.name !== undefined && currentUser?.memberId === id) {
        setCurrentUser((user) =>
          user ? { ...user, name: updates.name ?? user.name } : user,
        );
      }

      await refreshData();
    },
    [currentUser, isAdmin, refreshData, supabase],
  );

  const uploadMemberImage = useCallback(
    async (id: string, file: File) => {
      if (!supabase || !isAdmin) return;

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeName = `${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}.${extension}`;
      const path = `${id}/${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("member-profile-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Could not upload member image", uploadError);
        return;
      }

      const { data } = supabase.storage
        .from("member-profile-images")
        .getPublicUrl(path);
      const { error } = await supabase
        .from("members")
        .update({ profile_image_url: data.publicUrl })
        .eq("id", id);

      if (error) {
        console.error("Could not save member image", error);
        return;
      }

      await refreshData();
    },
    [isAdmin, refreshData, supabase],
  );

  const deleteMember = useCallback(
    async (id: string) => {
      if (!supabase || !isAdmin) return;

      await supabase.from("users").delete().eq("member_id", id);
      const { error } = await supabase.from("members").delete().eq("id", id);

      if (error) {
        console.error("Could not delete member", error);
        return;
      }

      await refreshData();
    },
    [isAdmin, refreshData, supabase],
  );

  const createMonthlyContribution = useCallback(
    async (month: number, year: number, amount: number) => {
      if (!supabase || !isAdmin || !currentUser) return;

      const existing = new Set(
        state.contributions
          .filter((record) => record.month === month && record.year === year)
          .map((record) => record.memberId),
      );
      const rows = state.members
        .filter(
          (member) => member.status === "active" && !existing.has(member.id),
        )
        .map((member) => ({
          member_id: member.id,
          month,
          year,
          amount: coerceMoney(amount),
          paid_amount: 0,
          status: "unpaid",
          created_by: currentUser.id,
        }));

      if (rows.length === 0) return;

      const { error } = await supabase.from("contributions").insert(rows);

      if (error) {
        console.error("Could not create contribution period", error);
        return;
      }

      await refreshData();
    },
    [currentUser, isAdmin, refreshData, state.contributions, state.members, supabase],
  );

  const updateContribution = useCallback(
    async (id: string, updates: Partial<Contribution>) => {
      if (!supabase || !isAdmin || !currentUser) return;

      const current = state.contributions.find((record) => record.id === id);
      if (!current) return;

      const next: Contribution = {
        ...current,
        ...updates,
        paidAmount: coerceMoney(updates.paidAmount ?? current.paidAmount),
      };

      if (next.status === "paid") {
        next.paidAmount = next.amount;
        next.paidDate = next.paidDate || today();
      }

      if (next.status === "unpaid") {
        next.paidAmount = 0;
        next.paidDate = undefined;
        next.paymentMethod = undefined;
      }

      if (next.status === "partial") {
        next.paidAmount = Math.min(next.paidAmount, next.amount);
        next.paidDate = next.paidDate || today();
      }

      const { error } = await supabase
        .from("contributions")
        .update({
          amount: next.amount,
          paid_amount: next.paidAmount,
          status: next.status,
          paid_date: next.paidDate ?? null,
          payment_method: next.paymentMethod ?? null,
          note: next.note ?? null,
        })
        .eq("id", id);

      if (error) {
        console.error("Could not update contribution", error);
        return;
      }

      await supabase.from("transactions").delete().eq("contribution_id", id);

      if (next.paidAmount > 0) {
        await supabase.from("transactions").insert({
          type: "Member Contribution",
          amount: next.paidAmount,
          date: next.paidDate || today(),
          member_id: next.memberId,
          contribution_id: next.id,
          payment_method: next.paymentMethod ?? null,
          note: next.note ?? null,
          created_by: currentUser.id,
          source: "auto",
        });
      }

      await refreshData();
    },
    [currentUser, isAdmin, refreshData, state.contributions, supabase],
  );

  const adjustMemberContributions = useCallback(
    async (memberId: string, diff: number, date: string, paymentMethod?: PaymentMethod, note?: string) => {
      if (!supabase || !isAdmin || !currentUser || diff === 0) return;

      if (diff > 0) {
        let remainingAmount = diff;
        let currentMonth = 5;
        let currentYear = 2026;

        while (remainingAmount > 0) {

          const existingPeriodForMember = state.contributions.some(
            (c) => c.memberId === memberId && c.month === currentMonth && c.year === currentYear
          );

          if (!existingPeriodForMember) {
            const row = {
                member_id: memberId,
                month: currentMonth,
                year: currentYear,
                amount: coerceMoney((currentMonth === 5 && currentYear === 2026) ? 5000 : state.settings.monthlyContribution),
                paid_amount: 0,
                status: "unpaid",
                created_by: currentUser.id,
            };

            await supabase.from("contributions").insert(row);
          }

          const { data: record } = await supabase
            .from("contributions")
            .select("*")
            .eq("member_id", memberId)
            .eq("month", currentMonth)
            .eq("year", currentYear)
            .single();

          if (record) {
            const dueForMonth = Math.max(record.amount - record.paid_amount, 0);
            
            if (dueForMonth > 0) {
              const amountToApply = Math.min(remainingAmount, dueForMonth);
              const newPaidAmount = record.paid_amount + amountToApply;
              const newStatus = newPaidAmount >= record.amount ? "paid" : "partial";
              
              await supabase
                .from("contributions")
                .update({
                  paid_amount: newPaidAmount,
                  status: newStatus,
                  paid_date: date,
                  payment_method: paymentMethod || null,
                  note: note || null,
                })
                .eq("id", record.id);

              remainingAmount -= amountToApply;
            }
          }

          currentMonth++;
          if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
          }
        }
      } else {
        let remainingAmountToRemove = Math.abs(diff);
        const { data: records } = await supabase
          .from("contributions")
          .select("*")
          .eq("member_id", memberId)
          .order("year", { ascending: false })
          .order("month", { ascending: false });

        if (records) {
          for (const record of records) {
            if (remainingAmountToRemove <= 0) break;
            if (record.paid_amount > 0) {
              const amountToRemove = Math.min(remainingAmountToRemove, record.paid_amount);
              const newPaid = record.paid_amount - amountToRemove;
              const newStatus = newPaid >= record.amount ? "paid" : newPaid > 0 ? "partial" : "unpaid";
              await supabase
                .from("contributions")
                .update({ paid_amount: newPaid, status: newStatus })
                .eq("id", record.id);
              remainingAmountToRemove -= amountToRemove;
            }
          }
        }
      }

      await refreshData();
    },
    [currentUser, isAdmin, refreshData, state.contributions, state.members, state.settings.monthlyContribution, supabase],
  );

  const addProject = useCallback(
    async (project: ProjectInput) => {
      if (!supabase || !isAdmin || !currentUser) return;

      const { data, error } = await supabase
        .from("projects")
        .insert(projectPayload(project))
        .select()
        .single();

      if (error) {
        console.error("Could not add project", error);
        return;
      }

      const nextProject = mapProject(data);
      const transactions = autoProjectTransactionPayloads(
        nextProject,
        currentUser.id,
      );

      if (transactions.length > 0) {
        await supabase.from("transactions").insert(transactions);
      }

      await refreshData();
    },
    [currentUser, isAdmin, refreshData, supabase],
  );

  const updateProject = useCallback(
    async (id: string, updates: Partial<ProjectInput>) => {
      if (!supabase || !isAdmin || !currentUser) return;

      const current = state.projects.find((project) => project.id === id);
      if (!current) return;

      const { data, error } = await supabase
        .from("projects")
        .update(
          projectPayload({
            name: updates.name ?? current.name,
            description: updates.description ?? current.description,
            investmentAmount:
              updates.investmentAmount ?? current.investmentAmount,
            expectedReturn: updates.expectedReturn ?? current.expectedReturn,
            actualReturn: updates.actualReturn ?? current.actualReturn,
            expense: updates.expense ?? current.expense,
            status: updates.status ?? current.status,
            startDate: updates.startDate ?? current.startDate,
            endDate: updates.endDate ?? current.endDate,
            note: updates.note ?? current.note,
          }),
        )
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Could not update project", error);
        return;
      }

      const nextProject = mapProject(data);
      await supabase
        .from("transactions")
        .delete()
        .eq("project_id", id)
        .eq("source", "auto");

      const transactions = autoProjectTransactionPayloads(
        nextProject,
        currentUser.id,
      );

      if (transactions.length > 0) {
        await supabase.from("transactions").insert(transactions);
      }

      await refreshData();
    },
    [currentUser, isAdmin, refreshData, state.projects, supabase],
  );

  const deleteProject = useCallback(
    async (id: string) => {
      if (!supabase || !isAdmin) return;

      await supabase.from("transactions").delete().eq("project_id", id);
      const { error } = await supabase.from("projects").delete().eq("id", id);

      if (error) {
        console.error("Could not delete project", error);
        return;
      }

      await refreshData();
    },
    [isAdmin, refreshData, supabase],
  );

  const addTransaction = useCallback(
    async (transaction: TransactionInput) => {
      if (!supabase || !isAdmin || !currentUser) return;

      if (transaction.type === "Member Contribution" && transaction.memberId) {
        const { error } = await supabase.from("transactions").insert({
          type: "Member Contribution",
          amount: coerceMoney(transaction.amount),
          date: transaction.date,
          member_id: transaction.memberId,
          payment_method: transaction.paymentMethod ?? null,
          note: transaction.note ?? null,
          created_by: currentUser.id,
          source: "manual",
        });

        if (!error) {
          await adjustMemberContributions(
            transaction.memberId,
            coerceMoney(transaction.amount),
            transaction.date,
            transaction.paymentMethod,
            transaction.note
          );
        }
        return;
      }

      const { error } = await supabase.from("transactions").insert({
        type: transaction.type,
        amount: coerceMoney(transaction.amount),
        date: transaction.date,
        member_id: transaction.memberId ?? null,
        project_id: transaction.projectId ?? null,
        contribution_id: transaction.contributionId ?? null,
        payment_method: transaction.paymentMethod ?? null,
        note: transaction.note ?? null,
        created_by: currentUser.id,
        source: "manual",
      });

      if (error) {
        console.error("Could not add transaction", error);
        return;
      }

      await refreshData();
    },
    [currentUser, isAdmin, refreshData, supabase, adjustMemberContributions],
  );

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<TransactionInput>) => {
      if (!supabase || !isAdmin) return;

      const payload: Record<string, string | number | null> = {};
      if (updates.type !== undefined) payload.type = updates.type;
      if (updates.amount !== undefined) {
        payload.amount = coerceMoney(updates.amount);
      }
      if (updates.date !== undefined) payload.date = updates.date;
      if (updates.memberId !== undefined) {
        payload.member_id = updates.memberId || null;
      }
      if (updates.projectId !== undefined) {
        payload.project_id = updates.projectId || null;
      }
      if (updates.contributionId !== undefined) {
        payload.contribution_id = updates.contributionId || null;
      }
      if (updates.paymentMethod !== undefined) {
        payload.payment_method = updates.paymentMethod || null;
      }
      if (updates.note !== undefined) payload.note = updates.note || null;

      if (Object.keys(payload).length === 0) return;

      const tx = state.transactions.find(t => t.id === id);
      
      const { error } = await supabase
        .from("transactions")
        .update(payload)
        .eq("id", id);

      if (error) {
        console.error("Could not update transaction", error);
        return;
      }

      if (tx && tx.type === "Member Contribution" && tx.memberId && updates.amount !== undefined) {
         const diff = Number(updates.amount) - Number(tx.amount);
         if (diff !== 0) {
           await adjustMemberContributions(tx.memberId, diff, tx.date, updates.paymentMethod, updates.note);
         }
      }

      await refreshData();
    },
    [isAdmin, refreshData, state.transactions, supabase, adjustMemberContributions],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!supabase || !isAdmin) return;

      const tx = state.transactions.find(t => t.id === id);

      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Could not delete transaction", error);
        return;
      }

      if (tx && tx.type === "Member Contribution" && tx.memberId) {
        await adjustMemberContributions(tx.memberId, -Number(tx.amount), tx.date);
      }

      await refreshData();
    },
    [isAdmin, refreshData, state.transactions, supabase, adjustMemberContributions],
  );

  const resetAllTransactions = useCallback(async () => {
    if (!supabase || !isAdmin) return;

    // Reset contributions
    await supabase
      .from("contributions")
      .update({ paid_amount: 0, status: "unpaid", paid_date: null })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Reset projects financials to 0
    await supabase
      .from("projects")
      .update({ expense: 0, actual_return: 0, profit: 0, loss: 0 })
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Delete all transactions
    await supabase
      .from("transactions")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    await refreshData();
  }, [isAdmin, refreshData, supabase]);

  const updateSettings = useCallback(
    async (settings: Partial<Settings>) => {
      if (!supabase || !isAdmin) return;

      const next = {
        ...state.settings,
        ...settings,
      };
      const payload = settingsPayload(next);
      const request = next.id
        ? supabase.from("settings").update(payload).eq("id", next.id)
        : supabase.from("settings").insert(payload);
      const { error } = await request;

      if (error) {
        console.error("Could not update settings", error);
        return;
      }

      await refreshData();
    },
    [isAdmin, refreshData, state.settings, supabase],
  );
  const fixDatabase = useCallback(async () => {
    if (!supabase || !isAdmin || !currentUser) return;
    
    // 1. Delete all contributions
    await supabase.from("contributions").delete().neq("id", "0");
    
    // 2. Fetch all member contribution transactions
    const { data: txs } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", "Member Contribution")
      .order("date", { ascending: true });
      
    if (txs) {
      for (const member of state.members) {
         const memberTxs = txs.filter(tx => tx.member_id === member.id);
         let remaining = memberTxs.reduce((acc, tx) => acc + tx.amount, 0);
         
         let m = 5;
         let y = 2026;
         
         const current = new Date();
         const currentM = current.getMonth() + 1;
         const currentY = current.getFullYear();
         
         while (remaining > 0 || y < currentY || (y === currentY && m <= currentM)) {
            const expectedAmount = (m === 5 && y === 2026) ? 5000 : state.settings.monthlyContribution;
            
            let paid = 0;
            let status = "unpaid";
            if (remaining >= expectedAmount) {
              paid = expectedAmount;
              status = "paid";
              remaining -= expectedAmount;
            } else if (remaining > 0) {
              paid = remaining;
              status = "partial";
              remaining = 0;
            }
            
            await supabase.from("contributions").insert({
              member_id: member.id,
              month: m,
              year: y,
              amount: expectedAmount,
              paid_amount: paid,
              status: status,
              created_by: currentUser.id
            });
            
            m++;
            if (m > 12) {
              m = 1;
              y++;
            }
         }
      }
    }
    
    await refreshData();
    alert("Database fixed!");
  }, [supabase, isAdmin, currentUser, state.members, state.settings.monthlyContribution, refreshData]);


  const allocatePayment = useCallback(
    async (memberId: string, amount: number, date: string, paymentMethod: PaymentMethod, note: string) => {
      await addTransaction({
        type: "Member Contribution",
        amount: amount,
        date: date,
        memberId: memberId,
        paymentMethod: paymentMethod,
        note: note
      });
    },
    [addTransaction]
  );

  const createPoll = useCallback(
    async (question: string, options: string[], deadline?: string) => {
      if (!supabase || !isAdmin) return;

      const { data, error } = await supabase
        .from("polls")
        .insert({ question, status: "open", deadline, created_by: currentUser?.id })
        .select()
        .single();

      if (error) {
        console.error("Could not create poll", error);
        return;
      }

      if (options.length > 0) {
        const optionsPayload = options.map((text) => ({
          poll_id: data.id,
          text,
        }));
        await supabase.from("poll_options").insert(optionsPayload);
      }

      await refreshData();
    },
    [isAdmin, refreshData, supabase, currentUser?.id],
  );

  const closePoll = useCallback(
    async (id: string) => {
      if (!supabase || !isAdmin) return;
      await supabase.from("polls").update({ status: "closed" }).eq("id", id);
      await refreshData();
    },
    [isAdmin, refreshData, supabase],
  );

  const deletePoll = useCallback(
    async (id: string) => {
      if (!supabase || !isAdmin) return;
      await supabase.from("polls").delete().eq("id", id);
      await refreshData();
    },
    [isAdmin, refreshData, supabase],
  );

  const castVote = useCallback(
    async (pollId: string, optionId: string) => {
      if (!supabase || !currentUser?.memberId) return;
      
      const { error } = await supabase.rpc("cast_vote", {
        p_poll_id: pollId,
        p_option_id: optionId,
      });

      if (error) {
        console.error("Could not cast vote", error);
        alert(`Failed to vote: ${error.message}`);
        return;
      }

      await refreshData();
    },
    [currentUser?.memberId, refreshData, supabase],
  );

  const value = useMemo(
    () => ({
      state,
      summary: calculateSummary(state),
      currentUser,
      isReady,
      isAdmin,
      login,
      logout,
      resetDemo,
      addMember,
      updateMember,
      uploadMemberImage,
      deleteMember,
      createMonthlyContribution,
      updateContribution,
      allocatePayment,
      addProject,
      updateProject,
      deleteProject,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      resetAllTransactions,
      updateSettings,
      fixDatabase,
      createPoll,
      closePoll,
      deletePoll,
      castVote,
    }),
    [
      addMember,
      addProject,
      addTransaction,
      createMonthlyContribution,
      currentUser,
      deleteMember,
      deleteProject,
      deleteTransaction,
      isAdmin,
      isReady,
      login,
      logout,
      resetAllTransactions,
      resetDemo,
      state,
      updateContribution,
      allocatePayment,
      updateMember,
      uploadMemberImage,
      updateProject,
      updateSettings,
      updateTransaction,
      createPoll,
      closePoll,
      deletePoll,
      castVote,
      fixDatabase,
    ],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);

  if (!context) {
    throw new Error("useStore must be used inside StoreProvider");
  }

  return context;
}

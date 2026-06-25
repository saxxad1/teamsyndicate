import type {
  Contribution,
  Member,
  PaymentMethod,
  PaymentStatus,
  Project,
  ProjectStatus,
  Role,
  Settings,
  Transaction,
  TransactionSource,
  TransactionType,
  UserAccount,
  Poll,
  PollOption,
  PollVoter,
  PollStatus,
} from "@/lib/types";

export type DbSettings = {
  id: string;
  group_name: string;
  currency: "BDT";
  first_month_contribution: string | number;
  monthly_contribution: string | number;
  fund_start_month: number;
  fund_start_year: number;
  created_at: string;
  updated_at: string;
};

export type DbMember = {
  id: string;
  member_code: string | null;
  name: string;
  designation: string | null;
  phone: string;
  email: string;
  nid: string | null;
  blood_group: string | null;
  address: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_name: string | null;
  opening_balance: string | number | null;
  profile_image_url: string | null;
  join_date: string;
  status: "active" | "inactive";
  created_at: string;
};

export type DbUser = {
  id: string;
  auth_id: string | null;
  name: string;
  email: string;
  role: Role;
  member_id: string | null;
  created_at: string;
};

export type DbContribution = {
  id: string;
  member_id: string;
  month: number;
  year: number;
  amount: string | number;
  paid_amount: string | number;
  status: PaymentStatus;
  paid_date: string | null;
  payment_method: PaymentMethod | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
};

export type DbProject = {
  id: string;
  name: string;
  description: string;
  investment_amount: string | number;
  expected_return: string | number;
  actual_return: string | number;
  expense: string | number;
  profit: string | number;
  loss: string | number;
  status: ProjectStatus;
  start_date: string;
  end_date: string | null;
  note: string | null;
  created_at: string;
};

export type DbTransaction = {
  id: string;
  type: TransactionType;
  amount: string | number;
  date: string;
  member_id: string | null;
  project_id: string | null;
  contribution_id: string | null;
  payment_method: PaymentMethod | null;
  note: string | null;
  created_by: string | null;
  source: TransactionSource;
  created_at: string;
};

export type DbPoll = {
  id: string;
  question: string;
  status: PollStatus;
  deadline: string | null;
  created_by: string | null;
  created_at: string;
};

export type DbPollOption = {
  id: string;
  poll_id: string;
  text: string;
  vote_count: number;
  created_at: string;
};

export type DbPollVoter = {
  poll_id: string;
  member_id: string;
  created_at: string;
};

function money(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

export function mapSettings(row: DbSettings): Settings {
  return {
    id: row.id,
    groupName: row.group_name,
    currency: row.currency,
    firstMonthContribution: money(row.first_month_contribution),
    monthlyContribution: money(row.monthly_contribution),
    fundStartMonth: row.fund_start_month,
    fundStartYear: row.fund_start_year,
  };
}

export function mapMember(row: DbMember): Member {
  return {
    id: row.id,
    memberCode: row.member_code ?? undefined,
    name: row.name,
    designation: row.designation ?? undefined,
    phone: row.phone,
    email: row.email,
    nid: row.nid ?? undefined,
    bloodGroup: row.blood_group ?? undefined,
    address: row.address ?? undefined,
    emergencyContactPhone: row.emergency_contact_phone ?? undefined,
    emergencyContactName: row.emergency_contact_name ?? undefined,
    openingBalance: money(row.opening_balance),
    profileImageUrl: row.profile_image_url ?? undefined,
    joinDate: row.join_date,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapUser(row: DbUser): UserAccount {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    memberId: row.member_id ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapContribution(row: DbContribution): Contribution {
  return {
    id: row.id,
    memberId: row.member_id,
    month: row.month,
    year: row.year,
    amount: money(row.amount),
    paidAmount: money(row.paid_amount),
    status: row.status,
    paidDate: row.paid_date ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    note: row.note ?? undefined,
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
  };
}

export function mapProject(row: DbProject): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    investmentAmount: money(row.investment_amount),
    expectedReturn: money(row.expected_return),
    actualReturn: money(row.actual_return),
    expense: money(row.expense),
    profit: money(row.profit),
    loss: money(row.loss),
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapTransaction(row: DbTransaction): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: money(row.amount),
    date: row.date,
    memberId: row.member_id ?? undefined,
    projectId: row.project_id ?? undefined,
    contributionId: row.contribution_id ?? undefined,
    paymentMethod: row.payment_method ?? undefined,
    note: row.note ?? undefined,
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
    source: row.source,
  };
}

export function mapPoll(row: DbPoll): Poll {
  return {
    id: row.id,
    question: row.question,
    status: row.status,
    deadline: row.deadline ?? undefined,
    createdBy: row.created_by ?? "",
    createdAt: row.created_at,
  };
}

export function mapPollOption(row: DbPollOption): PollOption {
  return {
    id: row.id,
    pollId: row.poll_id,
    text: row.text,
    voteCount: row.vote_count,
    createdAt: row.created_at,
  };
}

export function mapPollVoter(row: DbPollVoter): PollVoter {
  return {
    pollId: row.poll_id,
    memberId: row.member_id,
    createdAt: row.created_at,
  };
}

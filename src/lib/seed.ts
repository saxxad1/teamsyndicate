import type {
  AppState,
  Contribution,
  Member,
  PaymentMethod,
  Settings,
  Transaction,
  UserAccount,
} from "./types";

const createdAt = "2026-06-25T00:00:00.000Z";

const names = [
  "Arif Hasan",
  "Tanvir Ahmed",
  "Mahmudul Islam",
  "Sabbir Rahman",
  "Rakib Hossain",
  "Nayeem Khan",
  "Fahim Chowdhury",
  "Sajid Karim",
  "Imran Hossain",
  "Mominul Haque",
  "Rafiq Uddin",
  "Jahid Hasan",
  "Shahriar Alam",
  "Mehedi Hasan",
  "Asif Mahmud",
  "Nahid Islam",
];

export const seedMembers: Member[] = names.map((name, index) => {
  const id = `member-${String(index + 1).padStart(2, "0")}`;

  return {
    id,
    name,
    phone: `+88017${String(10000000 + index * 13729).slice(0, 8)}`,
    email:
      index === 0
        ? "member@teamsyndicate.local"
        : `${name.toLowerCase().replaceAll(" ", ".")}@teamsyndicate.local`,
    joinDate: "2026-05-01",
    status: "active",
    createdAt,
  };
});

export const seedSettings: Settings = {
  groupName: "Team Syndicate",
  currency: "BDT",
  firstMonthContribution: 5000,
  monthlyContribution: 2000,
  fundStartMonth: 5,
  fundStartYear: 2026,
};

export const seedUsers: UserAccount[] = [
  {
    id: "user-admin",
    name: "Team Syndicate Admin",
    email: "admin@teamsyndicate.local",
    password: "admin123",
    role: "admin",
    createdAt,
  },
  {
    id: "user-member-01",
    name: seedMembers[0].name,
    email: "member@teamsyndicate.local",
    password: "member123",
    role: "member",
    memberId: seedMembers[0].id,
    createdAt,
  },
];

function makeContribution(
  member: Member,
  month: number,
  year: number,
  amount: number,
  paidDate: string,
  paymentMethod: PaymentMethod,
): Contribution {
  return {
    id: `contribution-${year}-${String(month).padStart(2, "0")}-${member.id}`,
    memberId: member.id,
    month,
    year,
    amount,
    paidAmount: amount,
    status: "paid",
    paidDate,
    paymentMethod,
    note: month === 5 ? "First month contribution" : "Monthly contribution",
    createdBy: "user-admin",
    createdAt,
  };
}

export const seedContributions: Contribution[] = seedMembers.flatMap(
  (member, index) => [
    makeContribution(
      member,
      5,
      2026,
      5000,
      `2026-05-${String(3 + (index % 8)).padStart(2, "0")}`,
      index % 3 === 0 ? "Cash" : index % 3 === 1 ? "bKash" : "Bank",
    ),
    makeContribution(
      member,
      6,
      2026,
      2000,
      `2026-06-${String(4 + (index % 10)).padStart(2, "0")}`,
      index % 4 === 0 ? "Nagad" : index % 4 === 1 ? "bKash" : "Cash",
    ),
  ],
);

export const seedTransactions: Transaction[] = seedContributions.map(
  (contribution) => ({
    id: `transaction-${contribution.id}`,
    type: "Member Contribution",
    amount: contribution.paidAmount,
    date: contribution.paidDate ?? contribution.createdAt.slice(0, 10),
    memberId: contribution.memberId,
    contributionId: contribution.id,
    paymentMethod: contribution.paymentMethod,
    note: contribution.note,
    createdBy: "user-admin",
    createdAt: contribution.createdAt,
    source: "auto",
  }),
);

export const initialState: AppState = {
  users: seedUsers,
  members: seedMembers,
  contributions: seedContributions,
  projects: [],
  transactions: seedTransactions,
  settings: seedSettings,
  polls: [],
  pollOptions: [],
  pollVoters: [],
};

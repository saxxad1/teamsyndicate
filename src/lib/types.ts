export type Role = "admin" | "member";

export type MemberStatus = "active" | "inactive";

export type PaymentStatus = "paid" | "unpaid" | "partial";

export type PaymentMethod = "Cash" | "bKash" | "Nagad" | "Bank" | "Other";

export type ProjectStatus = "running" | "closed";

export type TransactionType =
  | "Member Contribution"
  | "Investment"
  | "Project Expense"
  | "Project Return"
  | "Profit"
  | "Loss"
  | "Other Income"
  | "Other Expense";

export type TransactionSource = "auto" | "manual";

export type Member = {
  id: string;
  memberCode?: string;
  name: string;
  designation?: string;
  phone: string;
  email: string;
  nid?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContactPhone?: string;
  emergencyContactName?: string;
  openingBalance?: number;
  profileImageUrl?: string;
  joinDate: string;
  status: MemberStatus;
  createdAt: string;
};

export type UserAccount = {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  memberId?: string;
  createdAt: string;
};

export type Contribution = {
  id: string;
  memberId: string;
  month: number;
  year: number;
  amount: number;
  paidAmount: number;
  status: PaymentStatus;
  paidDate?: string;
  paymentMethod?: PaymentMethod;
  note?: string;
  createdBy: string;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  investmentAmount: number;
  expectedReturn: number;
  actualReturn: number;
  expense: number;
  profit: number;
  loss: number;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  note?: string;
  createdAt: string;
};

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  memberId?: string;
  projectId?: string;
  contributionId?: string;
  paymentMethod?: PaymentMethod;
  note?: string;
  createdBy: string;
  createdAt: string;
  source: TransactionSource;
};

export type Settings = {
  id?: string;
  groupName: string;
  currency: "BDT";
  firstMonthContribution: number;
  monthlyContribution: number;
  fundStartMonth: number;
  fundStartYear: number;
};

export type AppState = {
  users: UserAccount[];
  members: Member[];
  contributions: Contribution[];
  projects: Project[];
  transactions: Transaction[];
  settings: Settings;
  polls: Poll[];
  pollOptions: PollOption[];
  pollVoters: PollVoter[];
};

export type Summary = {
  totalMembers: number;
  activeMembers: number;
  totalFundBalance: number;
  totalCollected: number;
  totalInvestment: number;
  totalProjectReturns: number;
  totalProjectExpense: number;
  totalProfit: number;
  totalLoss: number;
  otherIncome: number;
  otherExpense: number;
  thisMonthTotalCollection: number;
  thisMonthPaidMembers: number;
  thisMonthPartialMembers: number;
  thisMonthUnpaidMembers: number;
  runningProjects: number;
  closedProjects: number;
};

export const paymentMethods: PaymentMethod[] = [
  "Cash",
  "bKash",
  "Nagad",
  "Bank",
  "Other",
];

export const transactionTypes: TransactionType[] = [
  "Member Contribution",
  "Investment",
  "Project Expense",
  "Project Return",
  "Profit",
  "Loss",
  "Other Income",
  "Other Expense",
];

export type PollStatus = "open" | "closed";

export type Poll = {
  id: string;
  question: string;
  status: PollStatus;
  deadline?: string;
  createdBy: string;
  createdAt: string;
};

export type PollOption = {
  id: string;
  pollId: string;
  text: string;
  voteCount: number;
  createdAt: string;
};

export type PollVoter = {
  pollId: string;
  memberId: string;
  createdAt: string;
};

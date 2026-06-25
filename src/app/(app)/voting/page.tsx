"use client";

import { useState } from "react";
import { Plus, Save, Trash2, X, Vote, Lock } from "lucide-react";
import { Badge, EmptyState, IconButton, PageHeader, Section, TextInput } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function VotingPage() {
  const { state, isAdmin, currentUser, createPoll, closePoll, deletePoll, castVote } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [question, setQuestion] = useState("");
  const [deadline, setDeadline] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const activePolls = state.polls.filter((p) => p.status === "open");
  const closedPolls = state.polls.filter((p) => p.status === "closed");

  function handleAddOption() {
    setOptions([...options, ""]);
  }

  function handleOptionChange(index: number, value: string) {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }

  function handleRemoveOption(index: number) {
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    const validOptions = options.filter((o) => o.trim() !== "");
    if (!question.trim() || validOptions.length < 2) {
      alert("Please enter a question and at least 2 options.");
      return;
    }
    const isoDeadline = deadline ? new Date(deadline).toISOString() : undefined;
    createPoll(question, validOptions, isoDeadline);
    setIsCreating(false);
    setQuestion("");
    setDeadline("");
    setOptions(["", ""]);
  }

  function handleVote(pollId: string) {
    const optionId = selectedOptions[pollId];
    if (!optionId) return;
    castVote(pollId, optionId);
  }

  return (
    <>
      <PageHeader
        title="Voting"
        description="Anonymous polling for financial and structural decisions."
        action={
          isAdmin && !isCreating ? (
            <IconButton
              icon={Plus}
              label="Create Poll"
              onClick={() => setIsCreating(true)}
            />
          ) : undefined
        }
      />

      {isCreating && isAdmin && (
        <Section title="Create New Poll">
          <form className="grid gap-4" onSubmit={submitCreate}>
            <TextInput
              label="Question"
              required
              value={question}
              onChange={setQuestion}
              placeholder="e.g. Should we increase the monthly contribution?"
            />
            <TextInput
              label="Deadline (Optional)"
              type="datetime-local"
              value={deadline}
              onChange={setDeadline}
            />
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Options
              </label>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1">
                    <TextInput
                      label={`Option ${i + 1}`}
                      value={opt}
                      onChange={(v) => handleOptionChange(i, v)}
                      placeholder={`Enter text...`}
                      required={i < 2}
                    />
                  </div>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(i)}
                      className="mt-6 text-rose-500 hover:bg-rose-50 p-2 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-700"
              >
                + Add Option
              </button>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <IconButton icon={Save} label="Publish Poll" type="submit" />
              <IconButton
                icon={X}
                label="Cancel"
                variant="secondary"
                onClick={() => {
                  setIsCreating(false);
                  setQuestion("");
                  setDeadline("");
                  setOptions(["", ""]);
                }}
              />
            </div>
          </form>
        </Section>
      )}

      <Section title="Active Polls">
        {activePolls.length === 0 ? (
          <EmptyState
            title="There are currently no active polls to vote on."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activePolls.map((poll) => {
              const pollOpts = state.pollOptions.filter((o) => o.pollId === poll.id);
              const totalVotes = pollOpts.reduce((sum, o) => sum + o.voteCount, 0);
              const hasVoted = state.pollVoters.some(
                (v) => v.pollId === poll.id && v.memberId === currentUser?.memberId
              );

              const isTimeUp = poll.deadline ? new Date() >= new Date(poll.deadline) : false;
              const showResults = hasVoted && isTimeUp;

              return (
                <div key={poll.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-slate-900 leading-tight">
                      {poll.question}
                    </h3>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone="emerald">Open</Badge>
                      {poll.deadline && (
                        <span className="text-[10px] text-slate-500">
                          Ends: {new Date(poll.deadline).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {hasVoted ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Lock className="w-4 h-4" />
                        <span>You have voted anonymously.</span>
                      </div>
                      {!showResults ? (
                        <p className="text-sm text-indigo-600 bg-indigo-50 p-3 rounded-md">
                          Results will be visible after the poll deadline.
                        </p>
                      ) : (
                        <>
                          {pollOpts.map((opt) => {
                            const percent = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                            return (
                              <div key={opt.id} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="font-medium text-slate-700">{opt.text}</span>
                                  <span className="text-slate-500">{opt.voteCount} ({percent}%)</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })}
                          <div className="text-right text-xs text-slate-500 pt-2">
                            Total votes: {totalVotes}
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pollOpts.map((opt) => (
                        <label key={opt.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="radio"
                            name={`poll-${poll.id}`}
                            value={opt.id}
                            checked={selectedOptions[poll.id] === opt.id}
                            onChange={(e) => setSelectedOptions({ ...selectedOptions, [poll.id]: e.target.value })}
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                          />
                          <span className="text-sm font-medium text-slate-700">{opt.text}</span>
                        </label>
                      ))}
                      <div className="pt-2">
                        <IconButton
                          icon={Vote}
                          label="Cast Vote"
                          disabled={!selectedOptions[poll.id]}
                          onClick={() => handleVote(poll.id)}
                        />
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
                      <button
                        onClick={() => closePoll(poll.id)}
                        className="text-xs font-medium text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200"
                      >
                        Close Poll
                      </button>
                      <button
                        onClick={() => setDeleteModalId(poll.id)}
                        className="text-xs font-medium text-rose-500 hover:text-rose-700 px-3 py-1.5 rounded bg-rose-50 hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {closedPolls.length > 0 && (
        <Section title="Closed Polls">
          <div className="grid gap-4 md:grid-cols-2">
            {closedPolls.map((poll) => {
              const pollOpts = state.pollOptions.filter((o) => o.pollId === poll.id);
              const totalVotes = pollOpts.reduce((sum, o) => sum + o.voteCount, 0);

              return (
                <div key={poll.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-slate-700 leading-tight">
                      {poll.question}
                    </h3>
                    <Badge tone="slate">Closed</Badge>
                  </div>
                  
                  <div className="space-y-3 opacity-80">
                    {pollOpts.map((opt) => {
                      const percent = totalVotes > 0 ? Math.round((opt.voteCount / totalVotes) * 100) : 0;
                      return (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-600">{opt.text}</span>
                            <span className="text-slate-500">{opt.voteCount} ({percent}%)</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-slate-400 rounded-full" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {isAdmin && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setDeleteModalId(poll.id)}
                        className="text-xs font-medium text-rose-500 hover:text-rose-700 px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {deleteModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-900">Delete Poll</h3>
              <button
                type="button"
                onClick={() => setDeleteModalId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this poll? All votes will be permanently removed.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                onClick={() => setDeleteModalId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                onClick={() => {
                  if (deleteModalId) deletePoll(deleteModalId);
                  setDeleteModalId(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

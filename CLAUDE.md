References a shared AGENTS.md, but will also denote any specific Claude behavior here
@AGENTS.md

## Conversation logging (Claude Code)

Always maintain `docs/claude_logs.md` as the raw conversation transcript for this repo — it is Part 3 of the transcript deliverable Zach Reott requested, running parallel to `docs/gemini_logs.md` (Part 2) and following `docs/initial_agent_creation.md` (Part 1).

- Append **every turn of every Claude Code session** to `docs/claude_logs.md` incrementally, as the turn happens — never reconstruct it at the end.
- Format matches `docs/gemini_logs.md`: a `### Turn N` heading, then `#### USER` with the user's prompt **verbatim** in a ```text code block, then `#### ASSISTANT` with **Actions Taken** (numbered) and **Response & Clarifying Questions**.
- Do not summarize or paraphrase user prompts. Do not omit assistant response text. Tool invocations may be summarized rather than dumped.
- Claude Code writes only to `docs/claude_logs.md`; leave `docs/gemini_logs.md` for other in-editor tools.

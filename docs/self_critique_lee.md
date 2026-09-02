# Self-Critique by Lee: Truefit Cash Register

## 1. I should have split commits up more

While doing the AI processes, I should have commit more often to ensure rollbacks if something happened. Each phase should have had it's own commit and notes.

## 2. Way over-engineered

I decided to go all in on how I'd get an app up and running from the start. Everything is the setup and the work I would have done. I am aware that for this level of app, this was probably WAY too much and could have been made much easier. My requirement for Domain Driven Design, Feature Sliced Design and Single Responsibility Principle probably didn't help file count + dir counts.

## 3. Product Understanding and Feedback Loops

I know this is just a simple assessment, but if this were an actual app for a person or company, I would have loved to understand the product more. For example, what is the main purpose of this app? Who are it's main users? If they have an existing system, what are there painpoints now? Answer to those sort of questions would have lead me to have a better UX and UI for the app. Obviously, mobile works but definitely is not optimized as much as I would have liked to do.

## 4. Probably should have done a handoff more often

Between some of the phases, I could have made a handoff doc and made token comsumption shrink a bit.

## 5. AI use in project

AI use is kind of a double edged sword for me now. On the one hand, the AI process I now have is great to get code out there, but on the other hand, I'm really not doing as much manual work with it. If this were a full scale app, I still would start it in a similar fashion. I may have split it up a bit more as well. But eventually when applying new features to a growing code base, I think the AI tools would fail much more often. Overall, as I stated above, this is how I would start greenfield apps now. If you did want to see a more manual and less AI-generated appraoch to this, please let me know!

## 6. Verification of AI generated Pieces

Through unit tests was a pretty good indicator of what did and did not work. After everything, I did a few passes of manual testing as well.

## 7. AI Across the Problem

I basically stuck two agents (Antigravity and Claude) on the task. Have them discuss with each other before moving onto me is something I've found to be beneficial.

## 8. Changes, Strengths, Weakness

As stated above, if I had a user story and better understanding of who is using this, that would have driven my frontend a bit more. One of the things I really liked was the ability to upload files through the browser or through the CLI. I feel like this gives users a very unique flexibility when pulling in the repo. Something that was weak was the look and feel for me. While I thought it was functional and definitely worked well enough, I would have loved to really make it shine better. I suppose another weakpoint is the somewhat needless complexity of it? Did it need to be as over-engineered as a stated above? Definitely not. But following the README, I think the ways (DDD, FSD, and SRP) really do make this easy to read / follow and easy to edit / update.

---
title: "The return of Fable "
date: 2026-07-03
tags:
  - Fable
  - Work Updates
---
# The return of Fable 5

This has been an interesting few days in the world of vibe coding and project building. Unfortunately, I missed the initial release of Fable before it was surreptitiously removed by an order from the US government. Which itself raised a whole new conversation about the governance of LLMs, and the tiered levels of access to frontier LLMs that are likely in our future. 

We know that already that if we were paying per token for the usage of these models then they would be unaffordable for the majority of users, but that looks set to be the [future of Fable from July 8th](https://www.digitalapplied.com/blog/claude-fable-5-before-july-7-six-day-window-playbook). How this unfolds will be interesting for proprietary model providers, as the competition from open-weight model providers is currently hot on their heels.

This time I am trying to take advantage of exploring the capabilities of this 'mythos-class' model while we have access. My first port of call was to redesign my website, which I think it has done quite successfully! I have also been using it to explore potential weaknesses in the conservation copilot before I make it live to users. For this purpose it has been very useful, identifying potential prompt injection vulnerabilities and making adjustments to support multiple concurrent users. After many months of using Opus models, Fable does feel more competent completing complex tasks - although I haven't been using it long enough to know whether it is more thorough, or if I am just being gaslit by Claude's sycophantic style of communication.  

## Fable is unable to give its opinion

Earlier today [Will Morgan](https://www.zoo.cam.ac.uk/people/william-morgan) and I were exploring the ability of Fable to make judgements on the the benefits, harms, reliability and relevance of summaries on the [conservation evidence website](www.conservationevidence.com). However, we were stymied by Anthropic's lock down of Fables abilities, apparently asking the model to score certain aspects of a summary paragraph for conservation effectiveness triggers Fable to shut down. It must look to similar to asking Fable to find zero-day bugs in critical global infrastructures...  

This has been part of a longer running project that Will has been leading on understanding how we can score the effectiveness of conservation actions described in conservation evidence summaries. To achieve this would require a significant amount of human time, so we have been investigating how we could potentially use an LLM as a judge to accelerate the process. We are well aware that there are many [issues around asking LLMs to make judgements](https://arxiv.org/abs/2601.17312). However, we aren't accepting these judgements blindly, we are assessing them against human assessments. 

### The exploration continues until July 7th...


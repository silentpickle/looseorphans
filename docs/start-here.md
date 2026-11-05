# Start here: make your own adventure (no coding needed)

This guide is for fans who have never coded. You don't type any code yourself. You describe what you want in plain
words to an AI helper (Claude), and it does the technical part while you make the decisions. Plan an evening for the
first setup. After that, a new scene takes minutes and a whole adventure takes an afternoon or two.

## What you can make

| Time | What | Costs anything? |
|---|---|---|
| 5 minutes | Play both adventures in your browser | No |
| 15 minutes | Put your favourite members' names, pets and in-jokes into the story | No |
| An hour | Ask Claude for a new scene: a fan-meeting minigame, a new boss, a dorm cooking disaster | No (uses free stand-in art) |
| A weekend | A whole new adventure with your own premise, drawn art, music and cutscenes | Some, see below |

## What you need

- **A computer** (Mac or Windows). A phone or tablet can play the game but can't build it.
- **The Claude desktop app** with a paid Claude plan. Its **Code** tab is the AI helper that works on the project
  for you.
- **Optional, only for brand-new pictures, music and cutscenes:** a PixelLab account and a Google Gemini API key.
  Everything else works without them.

### What it costs, honestly

| Thing | Free option | If you pay |
|---|---|---|
| Claude (the helper) | none: Claude Code needs a paid plan | your monthly plan |
| Art from PixelLab | PixelLab has offered a free trial (reviews mention about 40 generations; check [their site](https://pixellab.ai) for today's numbers). That's enough for a small adventure's key pictures | prepaid credits |
| Free art with no account | character sprites are built from free LPC parts; anything not drawn yet shows as a simple placeholder | free |
| Music, cutscenes, portraits (Google Gemini API) | none for these models: they need billing turned on | the L-Team used about $4.50 for 5 songs, 8 portraits and 6 cutscenes |

### "Gemini" means two different things

People say "Gemini" for two separate products with separate billing. This project only uses the second one.

| | The Gemini **app** | The Gemini **API** |
|---|---|---|
| What it is | the chatbot at gemini.google.com and in the phone app | a key that lets *programs* call Google's models |
| What you pay | a monthly subscription (Google AI Plus / Pro) | per use, from a Google Cloud billing account |
| Where you get it | one.google.com | [Google AI Studio](https://aistudio.google.com/apikey), "Create API key" |
| Used by this project? | **no**: a subscription gives no API credit | **yes**: music, cutscenes and portraits |

So a Gemini subscription, including a free one, doesn't pay for this project's tools. An API key does, and only
after billing is turned on in Google AI Studio.

**About Google's student offer:** Google has offered college students a free year of the Gemini **app**
subscription (Google AI Pro, or AI Plus outside the US). It's handy for chatting about your story, but it doesn't
pay for the API key. It's usually for university students, and most reports say 18 and up. Check
[Google's student page](https://one.google.com/ai-student) for the current rules.

**If you're under 18:** ask a parent or guardian to own anything that needs a card, and to set a spending limit on
it. Every tool here shows you the price and waits for your "yes" before it spends a cent.

## Step 1: get the project

1. Install [GitHub Desktop](https://desktop.github.com) and sign in (a free GitHub account is fine).
2. On this project's GitHub page, choose **Code**, then **Open with GitHub Desktop**, and pick a folder.

Use GitHub Desktop rather than "Download ZIP". The ZIP leaves out the safety checks that stop you from accidentally
publishing a key.

## Step 2: let Claude set it up

Open the Claude desktop app, go to the **Code** tab, and open the project folder. Then paste:

> Set this project up on my computer and start the game so I can play it. I'm not a programmer, so explain anything
> you need me to click or approve.

Claude installs what's missing (Node and uv, which you never touch directly), starts the game, and shows it to you.
When it asks to run something, read the one-line description and approve it. To stop for the day, just close the app.

## Step 3: make it about your faves (free)

The story never hard-codes a name. Every name comes from one small file, and your own version of that file
(`cast.local.toml`) stays on your computer and is never uploaded. Paste:

> Help me make my own cast.local.toml. Ask me the names I want for each member, their pets, the fandom name and the
> L-Team codenames, then restart the game so I can see them.

## Step 4: your first scene (free)

> Add a short new scene to the L-Team: after the gate, the crew finds a vending machine that only sells banana milk.
> Make it one map with two characters and a small minigame. Use stand-in art for now.

Claude writes it, checks it, and plays it for you. Ask for changes the same way you'd ask a friend.

## Step 5: a whole adventure

Give Claude a premise, one or two sentences:

> Make a new adventure for this game: the members get trapped inside a fan-made rhythm game and have to win back
> their mic stands from a glitchy pixel MC. About 30 minutes. Add it to the adventure menu.

Claude follows the project's own checklist. It asks you a few questions (tone, who's in the party, how it ends),
shows a plan, writes the story, and makes it playable with free stand-in art. Then it **asks before spending
anything**: it shows how many pictures and how many dollars of music and cutscenes it wants, and waits. You can say
"pictures only", "fewer cutscenes" or "not yet". Each adventure has its own spending cap.

To make new art you'll need the keys from Step 6. Without them, your adventure still plays: it just uses the free
sprites and the stand-ins.

## Step 6 (optional): add your keys safely

Keys work like passwords that spend money. Ask Claude:

> Walk me through getting a PixelLab key and a Gemini API key and putting them in secrets.env. Don't ask me to paste
> them into this chat.

You'll paste each key into a file called `secrets.env` yourself. Claude never reads that file; the project blocks it
from doing so. Rules worth keeping:

- Never paste a key into a chat, Discord, a screenshot or an issue.
- If a key ever leaks, delete it on the provider's website straight away and make a new one.
- Turn on a spending limit or budget alert at Google before you start.

## Sharing it with friends

Claude can publish your copy as a free GitHub Pages website. Ask it to "help me publish my copy on GitHub Pages".

**Watch out for real names.** The website is built from what's on GitHub, so your `cast.local.toml` names *don't*
go up; the site shows the fictional defaults. That's on purpose. If you build the site on your own computer and upload
it somewhere else, your local names go with it. Think about that before sharing: these are real people.

## Keep it kind

- These are real people. Write them the way you'd be happy for them to read: affectionate, funny, never cruel.
- Romance stays sweet and chaste: notes, umbrellas, shared earphones.
- No real song lyrics, logos or music anywhere. The generators are told to make original sounds and pictures, and
  never get a real name, song or show title in their prompts. Claude keeps to this, but look over what it makes.

## Words you'll see

| Word | Means |
|---|---|
| repo / repository | the project folder, kept on GitHub |
| commit | a saved checkpoint of your changes, with a note saying what changed |
| push | upload your commits to GitHub |
| dry run | "here's what I'd make and what it would cost": nothing happens until you say yes |
| adventure | one whole game on the menu, like *The L-Team* |
| key / API key | a password that lets a tool use a paid service |
| stand-in | the plain placeholder shown until real art is drawn |

## When something breaks

Tell Claude what you see, in your own words: "the game is just a black screen", "it says permission denied", "the
music won't play". Screenshots help, as long as no key is visible in them. Nothing you try here can break your
computer, and every saved checkpoint can be gone back to.

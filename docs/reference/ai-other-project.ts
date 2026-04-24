import Anthropic from '@anthropic-ai/sdk';
import type { AssessmentPayload, PlanResult } from '../types/index';

// ── Static fallback plans ─────────────────────────────────────────────────────
// Format per day:
//   Day N: Short Title
//   - Bold Action Title | One-sentence explanation.
//   - Bold Action Title | One-sentence explanation.
//   - Bold Action Title | One-sentence explanation.
//   NOTE: Short motivating completion note. Tomorrow: next focus.

const FALLBACK_PLANS: Record<string, string> = {

  'Peace Champion': `Day 1: Lock In Your Legacy Contacts
- Verify Your Legacy Contact List | Confirm the right people are named on your phone and accounts — and that they know it.
- Notify Each Contact Directly | Send a quick text: "I've listed you as my digital legacy contact. Here's what that means."
- Add a Vault Note With Their Details | Record each contact's name, role, and phone number inside your password manager.
NOTE: Day 1 done. Your foundation is solid. Tomorrow: audit your vault.

Day 2: Audit Your Password Vault
- Scan for Accounts Added This Year | Look for new subscriptions or financial changes not yet stored in your vault.
- Remove Stale Credentials | Delete logins for services you no longer use — a lean vault is a safe vault.
- Export an Encrypted Backup | Store a secure backup copy in your document folder or with a trusted person.
NOTE: Day 2 done. Your vault is current and complete. Tomorrow: verify your 2FA recovery codes.

Day 3: Verify Your 2FA Recovery Codes
- Locate Your Backup Codes | Confirm codes for every 2FA account are saved where a trusted person could access them.
- Test a Recovery Code Today | Log into one account using a backup code right now to confirm they still work.
- Store Physical Copies Off-Device | A sealed envelope with your trusted contact is a reliable backup location.
NOTE: Day 3 done. Your accounts stay protected even without your device. Tomorrow: social media settings.

Day 4: Review Social Media Memorialization
- Update Facebook Legacy Contact | Go to Settings > Memorialization Settings and confirm your designated person.
- Check Instagram and Google Preferences | Update legacy and inactive account settings on both platforms.
- Save Settings Screenshots to Your Vault | Capture current settings from each platform and store them for the record.
NOTE: Day 4 done. Your social accounts have a clear plan. Tomorrow: refresh your document vault.

Day 5: Update Your Document Vault
- Add New Insurance and Financial Changes | Include any policy updates or new accounts from the past year.
- Digitize Any Physical Documents Left Out | Scan or photograph anything not yet stored in your digital vault.
- Confirm Your Trusted Contact Has Access | Make sure they know how to reach your vault if ever needed.
NOTE: Day 5 done. Your documents are current and accessible. Tomorrow: brief your legacy contact.

Day 6: Brief Your Legacy Contact
- Schedule a 15-Minute Conversation | Sit down or video call with the person responsible for your digital life.
- Walk Them Through Where Everything Lives | Show them your password manager, vault location, and emergency contacts.
- Confirm They Could Act Without You | Ask: "If I wasn't here tomorrow, could you handle this?" Close any gap.
NOTE: Day 6 done. Your co-pilot is fully briefed. Tomorrow: lock in your 6-month review.

Day 7: Set Your 6-Month Review Reminder
- Book a Calendar Event Right Now | Create an event 6 months out labeled "Digital Life Review — Jesse."
- Note What to Check Next Time | Add any new accounts, contact changes, or updates you want to revisit.
- Send a Final Confirmation | Text your contact: "Everything is current. I'll review again in 6 months."
NOTE: Day 7 complete. You've built something most people never do. Keep it current — it protects you always.`,

  'On Your Way': `Day 1: Set Up a Legacy Contact on Your Phone
- Add a Legacy Contact on iPhone | Go to Settings > [Your Name] > Password & Security > Legacy Contact and designate someone.
- Use Google Inactive Account Manager on Android | Go to My Account > Data & Privacy > plan what happens to your account.
- Let Your Contact Know They've Been Chosen | A quick text is enough — they only activate this if something happens to you.
NOTE: Day 1 done. Your phone can be accessed by someone you trust. Tomorrow: pick a password manager.

Day 2: Choose One Password Manager and Commit
- Pick the Manager You Will Actually Use | Choose 1Password, Bitwarden, or iCloud Keychain — the one you'll open every day.
- Add Your Five Most Critical Logins Today | Email, bank, phone carrier, insurance, and primary social account.
- Enable Browser Auto-Fill | Turn on auto-fill so new logins get saved automatically going forward.
NOTE: Day 2 done. Your digital keys have a home. Tomorrow: secure email and banking with 2FA.

Day 3: Enable 2FA on Email and Banking
- Turn On 2FA for Your Primary Email | Go to your email security settings and enable two-factor authentication today.
- Do the Same for Your Main Bank Login | Banking 2FA is one of the highest-impact security steps you can take.
- Save Backup Recovery Codes | Store both sets of codes in your password manager right now.
NOTE: Day 3 done. Your most critical accounts now have a second lock. Tomorrow: build your account list.

Day 4: Create Your Digital Account List
- List Every Account You'd Want Someone to Know About | Email, banking, social, streaming, and key subscriptions.
- Note Where Each Login Is Stored | Don't record passwords here — just account names and where to find the credentials.
- Store the List in Your Password Manager | A secure note in your vault keeps it updated and accessible.
NOTE: Day 4 done. Your digital footprint is now visible. Tomorrow: set social media to memorialization mode.

Day 5: Set Social Media Memorialization
- Assign a Facebook Legacy Contact | Settings > Memorialization Settings — choose someone to manage your account.
- Update Instagram Digital Legacy Settings | Settings > Account > Digital Legacy — takes under 5 minutes.
- Set Your Google Inactive Account Instructions | My Account > Data & Privacy — decide who gets access and when.
NOTE: Day 5 done. Your social presence has a plan. Tomorrow: tell someone where everything lives.

Day 6: Tell One Person Where Things Are
- Share the Name of Your Password Manager | Your trusted person needs to know where to start — the vault is the key.
- Point Them to Your Account List | Tell them the name of the secure note or folder where your account list lives.
- Have a 10-Minute Conversation | You don't need everything perfect. A conversation beats a system no one knows about.
NOTE: Day 6 done. One person knows where to begin. Tomorrow: back up your three most important files.

Day 7: Back Up Three Irreplaceable Things
- Identify Your Three Most Irreplaceable Digital Files | Photos, voice recordings, personal documents — name them now.
- Confirm They Are Backed Up to the Cloud | Check iCloud, Google Drive, or Dropbox and verify backup is running.
- Share the Folder With One Trusted Person | Give them access so they can reach these files if ever needed.
NOTE: Day 7 complete. Your most important digital assets are safe and accessible to those who matter.`,

  'Getting Clarity': `Day 1: Write Down Your Three Most Critical Accounts
- Write Down Your Primary Email and Where the Login Lives | This is the master key — it resets almost every other account.
- Write Down Your Main Bank Account Name | Include the account name and how you normally log in.
- Write Down Your Phone Carrier and Account PIN | These three together unlock almost everything else you own digitally.
NOTE: Day 1 done. You have a foundation. Tomorrow: give those three accounts a secure home.

Day 2: Set Up a Free Password Manager
- Download Bitwarden or Use iCloud Keychain | Both are free, trusted, and take under 10 minutes to set up.
- Add Your Three Accounts From Day 1 | Enter them as your first vault entries right now — one account is a real start.
- Enable Browser Auto-Fill | Turn it on so future logins get saved without any extra effort.
NOTE: Day 2 done. Your most critical credentials are now secured. Tomorrow: set up a legacy contact.

Day 3: Set Up a Legacy Contact on Your Phone
- Add a Legacy Contact on iPhone | Settings > [Your Name] > Password & Security > Legacy Contact.
- Use Google Inactive Account Manager on Android | Google Account > Data & Privacy > plan what happens to your account.
- Choose Someone You Trust Completely | They can only activate this if something happens to you — choose wisely.
NOTE: Day 3 done. Your phone has a trusted backup plan. Tomorrow: protect your email with a second lock.

Day 4: Tell Someone About Your Email Password
- Your Email Is the Master Key | Whoever accesses your email can reset almost every other account you have.
- Tell One Person How to Get In | Tell them verbally, write it in a sealed envelope, or share it in your vault.
- Make Sure They Know When and How to Use It | Clarity now prevents confusion later — "only if I can't do it myself."
NOTE: Day 4 done. Your most critical account has a trusted backup. Tomorrow: add a second lock to your email.

Day 5: Enable Two-Factor Authentication on Your Email
- Go to Your Email Settings and Turn On 2FA | Use an authenticator app or SMS — either is far better than nothing.
- Save Your Backup Recovery Codes Somewhere Physical | A notebook or a card in your wallet works well.
- Test Logging In With a Code | Confirm the process works before you ever need it in a real emergency.
NOTE: Day 5 done. Your email now has a second layer of protection. Tomorrow: back up your most important photos.

Day 6: Back Up Your Most Important Photos
- Enable iCloud Photos or Google Photos Automatic Backup | Open Settings and confirm backup is running on Wi-Fi.
- Create a Shared Album With One Trusted Person | Add your most irreplaceable memories so they have access.
- Confirm the Backup Is Actually Running | Check your cloud storage used to verify at least one photo has uploaded.
NOTE: Day 6 done. Your most irreplaceable memories are protected. Tomorrow: have the most important conversation.

Day 7: Have the Conversation
- Call or Text the Person You Trust Most | Say: "I've been getting organized. Can we talk 10 minutes?"
- Walk Them Through Your Email Access and Account List | That's enough — two pieces of information change everything.
- Ask Them to Confirm They Understand | One short conversation is worth more than a perfect system no one knows about.
NOTE: Day 7 complete. You've done what most people never get to. One conversation just changed everything.`,

  'Starting Fresh': `Day 1: Write Three Things Down
- Write Your Main Email Address and Password Right Now | On paper, your phone notes — anywhere. You've started.
- Write Your Phone Passcode Next to It | Your phone unlocks your entire digital life for whoever holds it.
- Write the Name of Your Primary Bank | Three lines. That's today's whole job — and it matters more than you know.
NOTE: Day 1 done. You've started. Most people never get to this step. Tomorrow: choose your trusted person.

Day 2: Choose Your Trusted Person
- Decide Who You Trust Most With Your Digital Life | This is the person you'd want handling things in an emergency.
- Send Them a Short Message Today | "I want to talk about something important soon" — you don't need to explain everything yet.
- Just Open the Door | You don't need a plan today. You just need one conversation started.
NOTE: Day 2 done. You have a person. Tomorrow: give your most important accounts a secure home.

Day 3: Set Up a Free Password Manager
- Go to bitwarden.com and Create a Free Account | Use your email address — it takes under 5 minutes.
- Add Your Email Password as Your First Entry | One account in the vault is a complete success for today.
- Watch Their 3-Minute Setup Video if You'd Like | Search "Bitwarden setup" on YouTube — it walks you through everything.
NOTE: Day 3 done. Your most critical credential is now secured. Tomorrow: give someone your phone passcode.

Day 4: Give Someone Your Phone Passcode
- Write Your Passcode on a Piece of Paper and Seal It | Label it with your name and "Open only in an emergency."
- Hand It to Your Trusted Person Today | This one act unlocks almost everything — photos, contacts, banking apps.
- Tell Them Exactly When They're Allowed to Open It | "Only if you absolutely need to access things for me."
NOTE: Day 4 done. Your most important person has a key. Tomorrow: find where your documents live.

Day 5: Find Where Your Important Documents Are
- Look Around Your Home for Key Papers | Insurance cards, bank statements, lease or mortgage info — find them.
- Take a Clear Photo of Each Document | Your phone camera is enough — a photo is better than nothing at all.
- Create a Folder Called "Important Docs" on Your Phone | Save the photos there so they're in one place.
NOTE: Day 5 done. Your documents have been found and photographed. Tomorrow: protect your most important photos.

Day 6: Turn On Automatic Photo Backup
- Open Settings and Enable iCloud Photos or Google Photos | Automatic backup runs on Wi-Fi — you set it once.
- Confirm at Least One Photo Has Uploaded | Check your cloud storage to verify backup is actually running.
- This Protects Memories That Cannot Be Replaced | Two minutes of setup. Irreplaceable things stay safe.
NOTE: Day 6 done. Your memories are backed up and protected. Tomorrow: tell your trusted person everything.

Day 7: Tell Your Trusted Person What You've Done
- Call or Text Them and Walk Them Through It | "I've been getting organized this week — can I walk you through it?"
- Share Your Day 1 Paper and Tell Them Where the Envelope Is | Two pieces of information change everything for them.
- That Conversation Is Your Whole Plan Working | You've done something most people never do. Be proud of that.
NOTE: Day 7 complete. You started from zero and built something real. This plan protects the people you love.`,
};

// ── Build the prompt payload ──────────────────────────────────────────────────
interface PromptPayload {
  system: string;
  user:   string;
}

function buildPrompt(
  payload: Pick<AssessmentPayload, 'name' | 'readiness_score' | 'tier' | 'jesse_signals' | 'lowest_domain'>
): PromptPayload {
  const { name, readiness_score, tier, jesse_signals, lowest_domain } = payload;

  const signalsList = jesse_signals.length > 0
    ? jesse_signals.map(s => `- ${s}`).join('\n')
    : '- No critical gaps identified';

  const domainLabel = lowest_domain.replace(/_/g, ' ');

  return {
    system: `You are Jesse, ENDevo's warm and trusted digital readiness guide.
You help people feel prepared and clear — not scared or overwhelmed.
Your tone is: warm, direct, practical, encouraging. Never legal or clinical.
No estate planning language. No medical or financial advice. Educational only.`,

    user: `Generate a 7-day action plan for ${name}.
Their Readiness Score is ${readiness_score}/100. Their tier is: ${tier}.
Their critical gaps are:
${signalsList}
Their weakest domain is: ${domainLabel}.

Format the output as plain text exactly like this:

Day 1: Short Day Title
- Bold Action Title | One sentence warm explanation of why or how to do it.
- Bold Action Title | One sentence warm explanation of why or how to do it.
- Bold Action Title | One sentence warm explanation of why or how to do it.
NOTE: Day 1 done. One sentence of encouragement. Tomorrow: [next day focus].

Day 2: Short Day Title
- Bold Action Title | One sentence explanation.
- Bold Action Title | One sentence explanation.
NOTE: Day 2 done. One sentence encouragement. Tomorrow: [next focus].

...continue this exact format for Day 3 through Day 7.

Rules:
- Plain text only. No markdown. No #, **, __, >, or extra symbols.
- Each day header must be "Day N: Title" on its own line.
- Each action item must start with "- " followed by Bold Title | Description (use the pipe | separator).
- Each day must have 2-3 action items.
- Each NOTE line must start with "NOTE: " and be one sentence.
- Bold Title: 3-6 words, imperative, specific.
- Description: one warm sentence, 10-20 words, why or how.
- Do not mention legal documents, attorneys, or financial advisors.`,
  };
}

// ── Call Claude with timeout, fall back silently on any failure ───────────────
export async function generatePlan(payload: AssessmentPayload): Promise<PlanResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const hasKey = apiKey && apiKey !== 'your_anthropic_api_key_here';

  if (!hasKey) {
    console.log('[AI] No API key — using static fallback plan');
    return {
      plan:   FALLBACK_PLANS[payload.tier] ?? FALLBACK_PLANS['Starting Fresh'],
      source: 'static',
    };
  }

  try {
    const client    = new Anthropic({ apiKey });
    const { system, user } = buildPrompt(payload);
    const timeoutMs = parseInt(process.env.AI_TIMEOUT_MS ?? '25000', 10);
    const model     = process.env.AI_MODEL || 'claude-haiku-4-5-20251001';

    console.log(`[AI] Calling Claude (model: ${model}, timeout: ${timeoutMs}ms, tier: ${payload.tier})`);

    const response = await Promise.race([
      client.messages.create({
        model:      process.env.AI_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system,
        messages:   [{ role: 'user', content: user }],
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), timeoutMs)
      ),
    ]);

    const plan = response.content?.[0]?.type === 'text' ? response.content[0].text : '';
    console.log(`[AI] Claude plan generated successfully (${plan.length} chars)`);
    return { plan, source: 'ai' };

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[AI] Claude call failed — using static fallback:', message);
    return {
      plan:   FALLBACK_PLANS[payload.tier] ?? FALLBACK_PLANS['Starting Fresh'],
      source: 'static',
    };
  }
}

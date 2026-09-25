import type { SupabaseClient, User } from "@supabase/supabase-js";
import { SCENES } from "../art/scenes";
import { h, svg } from "./dom";

/** Full-screen illustrated card used for sign-in and account states. */
function screen(...content: HTMLElement[]): HTMLElement {
  document.getElementById("gate")?.remove();
  const sc = svg(SCENES.rats(), "0 -110 400 360");
  sc.setAttribute("preserveAspectRatio", "xMidYMax slice");
  sc.classList.add("gate-scene");
  const root = h("div", { class: "gate", id: "gate" }, sc, h("div", { class: "gate-card" }, ...content));
  document.body.append(root);
  return root;
}

export function showSignIn(sb: SupabaseClient): void {
  const msg = h("p", { class: "muted", role: "status" });
  const email = h("input", { id: "gate-email", type: "email", required: true, autocomplete: "email", placeholder: "you@example.com" });
  const btn = h("button", { class: "btn primary", type: "submit" }, "Send me a sign-in link");
  const form = h(
    "form",
    {
      class: "gate-form",
      onsubmit: async (e: Event) => {
        e.preventDefault();
        btn.disabled = true;
        msg.textContent = "Sending…";
        // shouldCreateUser: false → only people invited in Supabase Auth get a link,
        // so visitors of the public site can't create accounts in the project.
        const { error } = await sb.auth.signInWithOtp({
          email: email.value.trim(),
          options: { emailRedirectTo: location.href.split("#")[0], shouldCreateUser: false },
        });
        btn.disabled = false;
        const notInvited = error && (error.status === 422 || /signups? not allowed|not found/i.test(error.message));
        msg.textContent =
          error && !notInvited
            ? `Couldn't send the link: ${error.message}`
            : "If this email is on the trip list, a sign-in link is on its way. Open it on this device.";
      },
    },
    h("div", { class: "field" }, h("label", { for: "gate-email", text: "Email" }), email),
    btn,
    msg,
  );
  screen(h("div", { class: "greet", text: "Praha by night" }), h("h1", { class: "gate-title", text: "Krysa" }), h("p", { text: "The team planner for the FrontKon week. Sign in to see the plan and the Rat Wall." }), form);
}

export function showNotMember(sb: SupabaseClient, email?: string): void {
  screen(
    h("h1", { class: "gate-title", text: "Almost there" }),
    h("p", { text: `${email ?? "This account"} isn't on the trip list yet. Ask the trip owner to add your email to the members list.` }),
    h("button", { class: "btn", type: "button", onclick: () => sb.auth.signOut().then(() => location.reload()) }, "Sign out"),
  );
}

/** First visit: ask for a display name so reactions and posts show who did them. */
export async function ensureProfile(sb: SupabaseClient, user: User): Promise<void> {
  const { data } = await sb.from("profiles").select("name").eq("id", user.id).maybeSingle();
  if (data?.name) return;
  await new Promise<void>((resolve) => {
    const name = h("input", { id: "gate-name", required: true, maxlength: "40", autocomplete: "given-name", placeholder: "Your first name" });
    const msg = h("p", { class: "err", role: "status" });
    screen(
      h("h1", { class: "gate-title", text: "Welcome" }),
      h("p", { text: "What should the rats call you?" }),
      h(
        "form",
        {
          class: "gate-form",
          onsubmit: async (e: Event) => {
            e.preventDefault();
            const { error } = await sb.from("profiles").upsert({ id: user.id, name: name.value.trim() });
            if (error) {
              msg.textContent = error.message;
              return;
            }
            document.getElementById("gate")?.remove();
            resolve();
          },
        },
        h("div", { class: "field" }, h("label", { for: "gate-name", text: "First name" }), name),
        h("button", { class: "btn primary", type: "submit" }, "Continue"),
        msg,
      ),
    );
  });
}

export function showDemoBanner(): void {
  const b = h(
    "div",
    { class: "demo-banner", role: "status" },
    h("span", { text: "Made-up demo trip, saved in this browser." }),
    h(
      "button",
      {
        class: "btn small ghost",
        type: "button",
        onclick: () => {
          try {
            for (const k of Object.keys(localStorage)) if (k.startsWith("krysa-") || k.startsWith("pw-")) localStorage.removeItem(k);
            sessionStorage.removeItem("pw-tab");
          } catch {
            /* nothing stored */
          }
          location.reload();
        },
      },
      "Reset demo",
    ),
    h("button", { class: "rm-close", type: "button", "aria-label": "Dismiss", onclick: () => b.remove() }, "×"),
  );
  document.body.append(b);
}

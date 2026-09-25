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

/** Pulls a code from an invite link (`…/#trip=the-code`) and removes it from the address bar. */
export function takeTripCodeFromUrl(): string | null {
  const m = /(?:^#|&)trip=([^&]*)/.exec(location.hash);
  if (!m) return null;
  history.replaceState(null, "", location.pathname + location.search);
  try {
    return decodeURIComponent(m[1].replace(/\+/g, " "));
  } catch {
    return m[1];
  }
}

/**
 * The only gate: a shared trip code, no accounts or emails. The device signs in
 * anonymously only when a code is tried (so portfolio visitors create nothing),
 * then `join_trip` checks the code in the database. Resolves once joined.
 */
export function joinWithTripCode(sb: SupabaseClient, fromLink: string | null): Promise<void> {
  return new Promise((resolve) => {
    const msg = h("p", { class: "err", role: "status" });
    const input = h("input", { id: "gate-code", required: true, autocomplete: "off", autocapitalize: "none", spellcheck: "false", placeholder: "The code from your group chat" });
    const btn = h("button", { class: "btn primary", type: "submit" }, "Join the trip");
    const tryCode = async (code: string) => {
      btn.disabled = true;
      msg.textContent = "Checking…";
      try {
        const { data: s } = await sb.auth.getSession();
        if (!s.session) {
          const { error } = await sb.auth.signInAnonymously();
          if (error) {
            msg.textContent = /anonymous/i.test(error.message)
              ? "Anonymous sign-ins are switched off in Supabase (see README)."
              : `Couldn't connect: ${error.message}`;
            return;
          }
        }
        const { data, error } = await sb.rpc("join_trip", { p_code: code });
        if (error) {
          msg.textContent = error.message.includes("too many") ? "Too many wrong codes. Try again in an hour." : `Couldn't check the code: ${error.message}`;
          return;
        }
        if (data !== true) {
          msg.textContent = "That's not the trip code.";
          input.focus();
          return;
        }
        document.getElementById("gate")?.remove();
        resolve();
      } catch {
        msg.textContent = "Couldn't reach the server. Check your connection and try again.";
      } finally {
        btn.disabled = false;
      }
    };
    const form = h(
      "form",
      {
        class: "gate-form",
        onsubmit: (e: Event) => {
          e.preventDefault();
          const code = input.value.trim();
          if (code) void tryCode(code);
        },
      },
      h("div", { class: "field" }, h("label", { for: "gate-code", text: "Trip code" }), input),
      btn,
      msg,
    );
    screen(
      h("div", { class: "greet", text: "Praha by night" }),
      h("h1", { class: "gate-title", text: "Krysa" }),
      h("p", { text: "The team planner for the FrontKon week. Enter the trip code to see the plan and the Rat Wall. You only need to do this once on each device." }),
      form,
    );
    if (fromLink) {
      input.value = fromLink;
      void tryCode(fromLink);
    } else input.focus();
  });
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

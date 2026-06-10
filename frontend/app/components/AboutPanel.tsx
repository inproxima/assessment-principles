"use client";

import { useState } from "react";

const STEPS: { n: string; title: string; body: React.ReactNode }[] = [
  {
    n: "1",
    title: "Input your course context",
    body: (
      <>
        Input your course context details as well as your course level learning outcomes. If you are
        looking at a graded assessment, choose &lsquo;Summative&rsquo; assessment type. If it is an
        ungraded assessment, choose &lsquo;Formative&rsquo; assessment type.
      </>
    ),
  },
  {
    n: "2",
    title: "Select the principles to explore",
    body: (
      <>
        Select the Assessment principles you want to explore further. We suggest you focus on 2 or 3
        rather than all 11 principles.
      </>
    ),
  },
  {
    n: "3",
    title: "Add your assessment task",
    body: (
      <>
        Add the details for your particular assessment task by either uploading a document describing
        the assignment or adding a text description in the appropriate box.
      </>
    ),
  },
  {
    n: "4",
    title: "Generate the report",
    body: (
      <>
        Click on the red &lsquo;Generate report&rsquo; button. This process may take a few minutes.
        Your Feedback Report will include three sections: Principles at a glance (high-level overview),
        Alignment (strength of your design), and Continue the journey (practical recommendation).
      </>
    ),
  },
  {
    n: "5",
    title: "Review the Feedback Report",
    body: (
      <>
        The Principles at a Glance section provides a simplistic high-level analysis based on the
        principle(s) you chose above. Note: It is common for the summary Alignment box to say &lsquo;No
        principles fully met&rsquo; as it is looking for direct correlations. It does not mean your
        assessment is poorly designed. The in-depth Alignment section outlines the current strengths of
        your assessment design. These descriptions can be helpful for articulating the purposes of the
        task to students and teaching assistants. The Continue the Journey section provides practical
        recommendations to consider as you move forward. These are considerations only, and we encourage
        you to reflect thoughtfully on how this assignment fits into the overall assessment design for
        your course and program.
      </>
    ),
  },
  {
    n: "6",
    title: "Generate another report or download",
    body: (
      <>
        Scroll up to generate another report or download the current report. As with all AI-powered
        tools, we encourage you to ask for multiple responses in order to use your own best judgment
        about which recommendations are most appropriate for your context. Note that the Assessment
        Principles Studio does not save any information, so you will want to download any reports that
        you would like to save or compare.
      </>
    ),
  },
  {
    n: "7",
    title: "Reflect on your assessment task design",
    body: (
      <>
        You may be ready to make some changes based on the recommendations provided by the Studio, or
        you may want to discuss them further with a colleague. We also welcome you to reach out to book
        an appointment with an assessment specialist at the Taylor Institute through our{" "}
        <a
          href="https://taylorinstitute.ucalgary.ca/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-burgundy-900 underline decoration-burgundy-900/30 underline-offset-2 hover:decoration-burgundy-900"
        >
          website
        </a>{" "}
        or by email at{" "}
        <a
          href="mailto:taylorinstitute@ucalgary.ca"
          className="font-medium text-burgundy-900 underline decoration-burgundy-900/30 underline-offset-2 hover:decoration-burgundy-900"
        >
          taylorinstitute@ucalgary.ca
        </a>
        .
      </>
    ),
  },
];

export function AboutPanel() {
  const [open, setOpen] = useState(false);

  return (
    <section className="overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-warm transition-shadow duration-300 hover:shadow-warm-lg">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-7 py-5 text-left"
      >
        <div className="h-5 w-0.5 rounded-full bg-burgundy-900/70" />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-normal tracking-tight text-stone-900">
            How the Studio works
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-stone-500">
            New here? Read the welcome and a step-by-step walkthrough.
          </p>
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-stone-400 transition-transform duration-300 ease-out ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${
          open ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-stone-100 px-7 py-6">
          <ol className="space-y-5">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-burgundy-50 font-display text-sm font-semibold text-burgundy-900">
                  {s.n}
                </span>
                <div className="min-w-0">
                  <h3 className="text-[14px] font-semibold text-stone-800">{s.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-stone-500">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

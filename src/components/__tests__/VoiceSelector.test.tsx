// src/components/__tests__/VoiceSelector.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { VoiceSelector } from "../VoiceSelector";

describe("VoiceSelector", () => {
  it("renders all voices", () => {
    render(<VoiceSelector selectedVoice="en" onSelect={() => {}} />);
    const options = screen.getAllByRole("option");
    expect(options.length).toBe(6);
  });
});

# No Browser Invariant

- Never use `browser_subagent` or browser automation tools that open windows or connect to the user's Google Chrome.
- The user tests the UI directly in their own browser at `http://localhost:5182`.
- Keep Vite's dev server running with `open: false`.

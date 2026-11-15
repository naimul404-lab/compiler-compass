# Compiler Compass

Compiler Compass is a small, interactive compiler explorer for arithmetic expressions. Enter an expression and follow it through lexical analysis, parsing, and evaluation—with each stage explained in plain language.

## What it does

- Tokenizes numbers, operators, and parentheses, including source positions.
- Parses expressions with the grammar `expression → term ((+ | -) term)*`, `term → factor ((* | /) factor)*`, and `factor → number | (expression)`.
- Renders the resulting abstract syntax tree (AST).
- Evaluates the tree recursively and reports helpful errors for invalid input.
- Includes example expressions and runs entirely in your browser.

This is an educational mini compiler front end, not a general-purpose programming-language compiler.

## Run locally

Open `index.html` in a modern browser, or start a static server in this folder:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## GitHub Pages

Enable Pages in **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/(root)`, and save. The site will then be available at:

`https://naimul404-lab.github.io/compiler-compass/`

## Built with

HTML, CSS, and vanilla JavaScript. No build step or dependencies required.

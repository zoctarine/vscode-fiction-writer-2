# What is fwmarkdown

Adds fiction writing specific flavours to plain markdown files.

All files with `fw.md` extension are considered to be Fiction Writer specific markdown

Fiction writer uses remark to parse and format markdown files

Not to mess with other Markdown plugins, `fw.md` extensions was chosen

- `fw` comes from <u>**F**</u>iciton <u>**W**</u>riter
- `fw.md`
- `fw.txt`

There are multiple types of formatting
- `.fw.md` - Default formatting (no special line break rules applied)
- `.fw.l.md` - Single <u>**L**</u>ine Paragraph - each hard line break starts a new paragraph
- `.fw.i.md` - Single Line Paragraph with <u>**I**</u>ndented first line - indented with default tab characters
- `.fw.s.md` - One <u>**S**</u>entence per line 

 
Metadata
- in filename:
  - formatting: 
    - `fw.i.` indent
    - `fw.l.` one line per sentence
    - `fw.` *default* - two line breaks for paragraph break
- in metadata:
  - ```yml
    format: i
    ```
- in separate file metadata:
  - contained in `[filename].yml`

- in separate folder
  - contained in `.fw/[filename].yml`
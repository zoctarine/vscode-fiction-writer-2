# Welcome to version 2 of the Fiction Writer extension for Visual Studio Code


## Why Fiction Writer 2?

Writing projects can spread across multiple files. 
Common writing tools use some kind of main project file, that can be opened only in that tool.
- documents should be editable in any standard text editor (mobile, web, desktop)
- documents should be easily syncable with cloud services (no proprietary file format, and minimize sync conflicts)
- there should be a way to organize multiple files into one writing projects
- there should be a way to easily reorder and combine files
- the order of files should be reflected in their name, so you can see proper file order in any document explorer, no proprietary file format
- when reordering files, there should be a minimum number of files touched, so reduce sync conflicts
- there should be a way of categorize or tag files, without any external tool
- there should be some naming or editing conventions, to group files into a project, but they should be easy to understand, or to fix manually
- files should be easily nestable, parent/child relations between documents must exist. also, should be reflected in naming, so no proprietary tool should be necessary to understand them
- files should be editable in markdown, or text format
- there should be a way of editing documents in a distraction free manner, with custom editor layout (eg. indent first line, etc)
- there should be a way of exporting the project into a single file, or a single folder, with all the files in the correct order, and with the correct naming (pdf, epub,etc)
- there should be a way of getting project document statistics
- multiple projects should be editable at the same time (you could have all your writings opened at once in an editor)
- the editor should always be free, and open source
- support easy file encryption, so you can store your files in the cloud, without worrying about privacy
- features should be modular, so you can enable/disable them as you wish


This is the README for 2.0

**Enjoy!**

## Combile

`code --extensionDevelopmentPath=$(pwd) --disable-extensions --inspect-extensions=9229`
## License

MIT License (see LICENSE file)

## Credits

This project uses icons from [Material Design Icons](https://github.com/google/material-design-icons), which are licensed under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)

This project uses icons from [Font Awesome Free 6](https://use.fontawesome.com/releases/v6.6.0/fontawesome-free-6.6.0-web.zip), distributed under the [SIL OFL license](https://scripts.sil.org/OFL)


fonttools ttLib MaterialSymbolsSharp-subset.ttf --flavor woff2 -o MaterialSymbolsSharp-subset.woff2

swap_vert e8d5
link e250
link_off e16f
clock_loader_10 f726
clock_loader_20 f725
clock_loader_40 f724
clock_loader_60 f723
clock_loader_80 f722
clock_loader_90 f721
task_alt e2e6
hourglass_empty e88b
hourglass_disabled ef53
format_line_spacing e240
vertical_distribute e076
```sh
python3 -m venv .venv
source .venv/bin/activate
fonttools subset MaterialSymbolsSharp.ttf \
--unicodes=5f-7a,30-39,e8d5,e250,e16f,f726,f725,f724,f723,f722,f721,e2e6,e88b,ef53,e240,e076 \
--no-layout-closure \
--output-file=MaterialSymbolsSharp-subset.woff2 \
--flavor=woff2
```
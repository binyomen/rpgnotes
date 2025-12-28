# rpgnotes

Easily generate a static site for RPG notes.

## Installation

Set up `node` and `npm`, then install `rpgnotes` globally:
```
npm install --global @binyomen/rpgnotes
```

## Usage

```
Usage: rpgnotes [--gm-mode] [--no-time] [--watch [--serve]]
```

### Arguments

| Flag      | Description                                              |
| --------- | -------------------------------------------------------- |
| --gm-mode | Enables GM mode, which displays secrets                  |
| --no-time | Disables timestamp generation (see RPGNOTES_NO_TIME)     |
| --watch   | Watches for changes and automatically rebuilds the site  |
| --serve   | If watch is enabled, runs a web server to serve the site |

### Environment variables

| Variable             | Description                            |
| -------------------- | -------------------------------------- |
| RPGNOTES_NO_TIME     | Disables timestamp generation on pages |
| RPGNOTES_PERFORMANCE | Enables performance logging            |

import argparse
import os
import re
from pathlib import Path
from typing import List, Tuple


def natural_key(s: str):
    """Return a key for natural sorting (e.g., track2 < track10)."""
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r"(\d+)", s)]


def find_mp3s(root: Path) -> List[Path]:
    """Return a list of all .mp3 files under root (case-insensitive), sorted naturally by path."""
    mp3s: List[Path] = []
    for dirpath, dirnames, filenames in os.walk(root):
        # Optionally ignore hidden/system directories
        dirnames[:] = [d for d in dirnames if not d.startswith('.') and d.lower() not in {'system volume information', '$recycle.bin'}]
        for fn in filenames:
            if fn.lower().endswith('.mp3'):
                mp3s.append(Path(dirpath) / fn)
    # Natural sort by relative path components
    def path_key(p: Path):
        rel = p.relative_to(root)
        parts = list(rel.parts)
        return [natural_key(part) for part in parts]

    mp3s.sort(key=path_key)
    return mp3s


def build_directory_tree(root: Path, mp3s: List[Path]):
    """Build a nested dict tree from a list of mp3 Paths.

    Tree node format:
    {
        'name': 'FolderName',
        'path': Path,
        'subdirs': { name: node, ... },
        'files': [Path, ...]  # files directly in this folder
    }
    """
    tree = {
        'name': root.name,
        'path': root,
        'subdirs': {},
        'files': []
    }
    for p in mp3s:
        rel = p.relative_to(root)
        parts = list(rel.parts)
        cursor = tree
        for part in parts[:-1]:
            if part not in cursor['subdirs']:
                cursor['subdirs'][part] = {
                    'name': part,
                    'path': cursor['path'] / part,
                    'subdirs': {},
                    'files': []
                }
            cursor = cursor['subdirs'][part]
        cursor['files'].append(p)
    # Sort subdirs and files naturally
    def sort_node(node):
        node['files'].sort(key=lambda p: natural_key(p.name))
        for name, sub in sorted(node['subdirs'].items(), key=lambda kv: natural_key(kv[0])):
            sort_node(sub)
        # Reassign ordered subdirs as dict in sorted order to preserve iteration order in Python 3.7+
        node['subdirs'] = {name: node['subdirs'][name] for name in sorted(node['subdirs'].keys(), key=natural_key)}

    sort_node(tree)
    return tree


def html_escape(text: str) -> str:
    return (
        text.replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#39;')
    )


def render_html(tree, root: Path, output_path: Path, title: str) -> str:
    """Render the full HTML document as a string."""
    # Because the HTML file will be placed at output_path, make links relative to output directory
    link_base = output_path.parent

    def rel_href(p: Path) -> str:
        try:
            rel = p.relative_to(link_base)
        except ValueError:
            # Fall back to absolute path if not relative
            rel = p
        # Use POSIX-style separators for URLs
        return rel.as_posix()

    def folder_track_count(node) -> int:
        count = len(node['files'])
        for sub in node['subdirs'].values():
            count += folder_track_count(sub)
        return count

    def render_node(node, depth: int = 0) -> str:
        indent = '    ' * depth
        name = node['name']
        total_tracks = folder_track_count(node)
        is_root = node['path'] == root
        summary_label = f"{html_escape(name)} • {total_tracks} track{'s' if total_tracks != 1 else ''}" if not is_root else f"{html_escape(title)} • {total_tracks} track{'s' if total_tracks != 1 else ''}"
        # Root is expanded by default; others collapsed
        open_attr = ' open' if is_root else ''
        html = [f"{indent}<details class=\"folder\"{open_attr}>",
                f"{indent}  <summary>",
                f"{indent}    <span class=\"folder-icon\">📁</span>",
                f"{indent}    <span class=\"folder-name\">{summary_label}</span>",
                f"{indent}  </summary>",
                f"{indent}  <div class=\"folder-body\">"]
        # Subfolders first
        for subname, subnode in node['subdirs'].items():
            html.append(render_node(subnode, depth + 1))
        # Files
        if node['files']:
            html.append(f"{indent}    <ul class=\"track-list\">")
            for f in node['files']:
                rel = rel_href(f)
                display = f.name
                html.append(
                    f"{indent}      <li class=\"track\">"
                    f"<a href=\"{html_escape(rel)}\" class=\"track-link\" target=\"_blank\" title=\"Play {html_escape(display)}\">"
                    f"<span class=\"track-icon\">🎵</span>"
                    f"<span class=\"track-name\">{html_escape(display)}</span>"
                    f"</a>"
                    f"</li>"
                )
            html.append(f"{indent}    </ul>")
        html.append(f"{indent}  </div>")
        html.append(f"{indent}</details>")
        return "\n".join(html)

    total = folder_track_count(tree)

    head = f"""<!DOCTYPE html>
<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n  <title>{html_escape(title)} — Music Library</title>\n  <style>
    :root {{
      --bg: #0f1115; --card: #151925; --muted: #9aa4b2; --fg: #e6e9ef; --accent: #6ea8fe; --accent-2: #8b5cf6; --border: #232838;
    }}
    * {{ box-sizing: border-box; }}
    html, body {{ margin: 0; padding: 0; background: var(--bg); color: var(--fg); font: 16px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }}
    a {{ color: inherit; text-decoration: none; }}
    .container {{ max-width: 1100px; margin: 0 auto; padding: 24px; }}
    header {{ display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; }}
    .title {{ font-weight: 700; font-size: 28px; letter-spacing: 0.2px; }}
    .meta {{ color: var(--muted); font-size: 14px; }}

    .search {{ position: sticky; top: 0; background: linear-gradient(180deg, rgba(15,17,21,0.9) 0%, rgba(15,17,21,0.6) 100%); backdrop-filter: blur(6px); z-index: 5; padding: 12px 0 8px; }}
    .search input {{ width: 100%; padding: 12px 14px; border-radius: 10px; background: var(--card); border: 1px solid var(--border); color: var(--fg); outline: none; transition: border-color .2s, box-shadow .2s; }}
    .search input:focus {{ border-color: var(--accent); box-shadow: 0 0 0 3px rgba(110,168,254,0.15); }}

    details.folder {{ background: var(--card); border: 1px solid var(--border); border-radius: 12px; margin: 12px 0; overflow: clip; }}
    details.folder > summary {{ list-style: none; display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 14px 16px; font-weight: 600; }}
    details.folder > summary::-webkit-details-marker {{ display: none; }}
    details.folder[open] > summary {{ border-bottom: 1px solid var(--border); background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0)); }}
    .folder-icon {{ opacity: 0.9; }}
    .folder-name {{ color: var(--fg); }}
    .folder-body {{ padding: 8px 12px 14px; }}

    ul.track-list {{ list-style: none; margin: 6px 0 4px 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 8px; }}
    .track {{ }}
    .track-link {{ display: flex; align-items: center; gap: 10px; padding: 10px 12px; border: 1px solid var(--border); border-radius: 10px; background: #0f1320; transition: transform .1s ease, border-color .2s, background .2s; }}
    .track-link:hover {{ transform: translateY(-1px); border-color: var(--accent); background: #11162a; }}
    .track-icon {{ color: var(--accent-2); }}
    .track-name {{ overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }}

    footer {{ color: var(--muted); font-size: 13px; text-align: center; padding: 24px 0 12px; }}
    .hidden {{ display: none !important; }}
  </style>\n</head>"""

    body_open = f"""
<body>
  <div class=\"container\">
    <header>
      <div class=\"title\">{html_escape(title)}</div>
      <div class=\"meta\">{total} track{'s' if total != 1 else ''}</div>
    </header>
    <div class=\"search\">
      <input id=\"search\" type=\"search\" placeholder=\"Search tracks and folders...\" autocomplete=\"off\" />
    </div>
"""

    tree_html = render_node(tree, 2)

    scripts = """
    <script>
      // Simple client-side filter: hides folders and tracks not matching
      const input = document.getElementById('search');
      const normalize = s => (s || '').toLowerCase();
      input?.addEventListener('input', () => {
        const q = normalize(input.value);
        const folders = document.querySelectorAll('details.folder');
        folders.forEach(d => {
          const summaryText = normalize(d.querySelector('summary')?.innerText || '');
          const tracks = Array.from(d.querySelectorAll('.track'));
          let anyTrackVisible = false;
          tracks.forEach(li => {
            const name = normalize(li.innerText);
            const show = !q || name.includes(q);
            li.classList.toggle('hidden', !show);
            if (show) anyTrackVisible = true;
          });
          const showFolder = !q || summaryText.includes(q) || anyTrackVisible;
          d.classList.toggle('hidden', !showFolder);
          // Expand folder if any matching found
          if (q && showFolder) d.setAttribute('open', ''); else if (!q && d !== folders[0]) d.removeAttribute('open');
        });
      });
    </script>
"""

    body_close = """
    <footer>Generated by writeHtml • {date}</footer>
  </div>
</body>
</html>
""".replace('{date}', html_escape(__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M')))

    return "\n".join([head, body_open, tree_html, scripts, body_close])


def main(argv: List[str] = None) -> Tuple[int, str]:
    parser = argparse.ArgumentParser(
        description='Generate an aesthetically pleasing HTML index of MP3 files, reflecting the folder structure.'
    )
    parser.add_argument('directory', help='Root directory to scan for MP3 files.')
    parser.add_argument('--title', help='Page title shown in the HTML.', default=None)
    parser.add_argument('--output', '-o', help='Output HTML file path. Defaults to music_index.html inside the given directory.', default=None)
    args = parser.parse_args(argv)

    root = Path(args.directory).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        return 1, f"Error: '{root}' is not a valid directory."

    title = args.title or f"Music Library — {root.name}"

    output_path = Path(args.output).expanduser().resolve() if args.output else (root / 'music_index.html')

    mp3s = find_mp3s(root)
    tree = build_directory_tree(root, mp3s)

    html = render_html(tree, root, output_path, title)
    try:
        output_path.write_text(html, encoding='utf-8')
    except OSError as e:
        return 2, f"Failed to write HTML: {e}"

    return 0, str(output_path)


if __name__ == '__main__':
    code, msg = main()
    if code != 0:
        print(msg)
        raise SystemExit(code)
    else:
        print(f"HTML generated at: {msg}")

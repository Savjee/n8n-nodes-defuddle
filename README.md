# n8n-nodes-defuddle

This is an n8n community node that wraps [Defuddle](https://github.com/kepano/defuddle) for URL-based article and webpage content extraction.

It is similar in spirit to a webpage content extraction node, but instead of requiring pre-fetched HTML as input, this node always requires a URL and then:

- fetches the page in the node
- passes the HTML to Defuddle
- returns the raw Defuddle response object without modifying its fields

## Important compatibility note

This package currently uses external runtime dependencies (`defuddle` and `happy-dom`) and therefore is configured for general community-node use rather than n8n Cloud verification.

## Installation

Follow the [installation guide for community nodes](https://docs.n8n.io/integrations/community-nodes/installation/).

Package name:

```bash
n8n-nodes-defuddle
```

## Compatibility

- Built with the current n8n community node tooling
- Intended for recent n8n 1.x versions

## Usage

Add the **Defuddle** node to your workflow and provide a **URL**.

The node always requires a URL. All other Defuddle settings are optional and available in the **Options** section.

The output is the raw Defuddle result object for each input item. The node does not reshape or filter the library response.

Typical output fields may include:

- `content`
- `title`
- `description`
- `domain`
- `favicon`
- `image`
- `language`
- `metaTags`
- `parseTime`
- `published`
- `author`
- `site`
- `schemaOrgData`
- `wordCount`
- optional `contentMarkdown`
- optional `debug`
- optional `variables`
- optional `extractorType`

## Notes

- This package wraps Defuddle’s parsing library in an n8n node.
- It does not attempt to replicate every internal fetch heuristic from Defuddle’s CLI.
- Markdown-related behavior is delegated entirely to Defuddle.
- Because the output is passed through directly from Defuddle, fields may evolve as the upstream library evolves.

## Development

```bash
npm install
npm run lint
npm run build
npm run dev
```

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Defuddle repository](https://github.com/kepano/defuddle)

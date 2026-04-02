# n8n-nodes-defuddle

This is an n8n community node that wraps [Defuddle](https://github.com/kepano/defuddle) for webpage content extraction.

It is similar in spirit to my [webpage content extraction node](https://github.com/Savjee/n8n-nodes-webpage-content-extractor).



## Installation

Follow the [installation guide for community nodes](https://docs.n8n.io/integrations/community-nodes/installation/).

Package name:

```bash
n8n-nodes-defuddle
```

## Usage

- Fetch the HTML contents of a webpage (using the built-in HTTP Request node or any other means)
- Give the raw HTML to this node and get the main content back in any of the supported formats.

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
- Because the output is passed through directly from Defuddle, fields may evolve as the upstream library evolves.

## Example workflow
You can copy/paste this into your own n8n install.

```
{
  "nodes": [
    {
      "parameters": {},
      "type": "n8n-nodes-base.manualTrigger",
      "typeVersion": 1,
      "position": [
        0,
        0
      ],
      "id": "0b8e8962-f9cc-47ef-a688-ca3990524f26",
      "name": "When clicking ‘Execute workflow’"
    },
    {
      "parameters": {
        "html": "={{ $json.data }}",
        "options": {
          "markdown": true
        }
      },
      "type": "CUSTOM.defuddle",
      "typeVersion": 2,
      "position": [
        528,
        0
      ],
      "id": "89e2baca-0c2f-44ac-95cf-323408c3411a",
      "name": "Defuddle"
    },
    {
      "parameters": {
        "url": "https://defuddle.md/docs",
        "options": {}
      },
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.4,
      "position": [
        272,
        0
      ],
      "id": "845ea4f5-62aa-4cee-b795-916da726af27",
      "name": "Fetch webpage"
    }
  ],
  "connections": {
    "When clicking ‘Execute workflow’": {
      "main": [
        [
          {
            "node": "Fetch webpage",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Fetch webpage": {
      "main": [
        [
          {
            "node": "Defuddle",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "meta": {
    "instanceId": "2400d6b8770fdb69673c155b76f4d04dab0cc75c2877d2f8189a89d057787dc2"
  }
}
```

## Resources
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Defuddle repository](https://github.com/kepano/defuddle)


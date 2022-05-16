# update-eik-alias-action
Update Eik alias for package using the eik cli (https://eik.dev/docs/client#alias-1)

This can for instance be set up as a manual workflow action:
```yaml
on:
  workflow_dispatch:
    inputs:
      alias:
        description: "Version alias (defaults to current major version)"
        required: false
      version:
        description: "Version to alias (defaults to current version in repo)"
        required: false

name: Deploy
jobs:
  update-alias:
    name: Update Eik alias
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Update alias
        uses: emilhauk/update-eik-alias-action@master
        with:
          alias: ${{ github.event.inputs.alias }}
          version: ${{ github.event.inputs.version }}
          eik-server-key: ${{ secrets.EIK_SERVER_KEY }}

```

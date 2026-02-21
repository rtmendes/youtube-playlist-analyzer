# Enable CI on GitHub

The repo has a CI workflow committed locally (`.github/workflows/ci.yml`) but **GitHub blocks pushing workflow files** unless your Personal Access Token has the **`workflow`** scope.

## Option A – Fix push (recommended)

1. In GitHub: **Settings → Developer settings → Personal access tokens** (or Fine-grained tokens).
2. Edit the token you use for this repo and enable the **`workflow`** scope (and **Contents: Read and write** if using fine-grained).
3. From your machine:
   ```bash
   git push
   ```
   The existing commit that adds `.github/workflows/ci.yml` will push and CI will run on the next push/PR.

## Option B – Add the workflow in the GitHub UI

1. On GitHub, open your repo → **Add file** → **Create new file**.
2. Set the path to: **`.github/workflows/ci.yml`**
3. Paste the contents from **`docs/ci-workflow-example.yml`** (or from your local `.github/workflows/ci.yml`).
4. Commit to `main`.

After that, CI will run on pushes and pull requests to `main`.

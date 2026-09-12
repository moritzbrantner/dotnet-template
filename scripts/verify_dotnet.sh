#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

expected_sdk="$(python3 -c 'import json; print(json.load(open("global.json"))["sdk"]["version"])')"
actual_sdk="$(dotnet --version)"

if [[ "$actual_sdk" != "$expected_sdk" ]]; then
  echo "Expected .NET SDK $expected_sdk from global.json, got $actual_sdk." >&2
  exit 1
fi

dotnet restore DotnetTemplate.slnx
dotnet format DotnetTemplate.slnx --verify-no-changes --no-restore
dotnet build DotnetTemplate.slnx --configuration Release --no-restore
dotnet test DotnetTemplate.slnx --configuration Release --no-build

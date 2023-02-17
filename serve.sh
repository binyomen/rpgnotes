#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

cd "$(dirname "$0")/build/"
python3 -m http.server > /dev/null 2>&1

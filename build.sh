#!/usr/bin/env bash

set -o errexit
set -o nounset
set -o pipefail

main() {
    RPGNOTES_NO_TIME=1 RPGNOTES_PERFORMANCE=1 node index.js "$@"
}

main "$@"

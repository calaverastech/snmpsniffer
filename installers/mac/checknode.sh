#!/bin/bash

version=$(node -v 2> /dev/null | sed -E 's|^v([0-9])\.([0-9]+.)\.([0-9]+)?$|\2|')
$(exit $version)

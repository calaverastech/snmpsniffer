#!/bin/bash

version=$(java -version 2>&1 |node -v 2>&1 | sed -E 's|^v([0-9])\.([0-9]+.)\.([0-9]+)?$|\2|')
$(exit $version)

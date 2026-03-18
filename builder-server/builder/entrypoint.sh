#!/bin/bash

chown -R builder:builder /home/app/output

exec su-exec builder node script.js
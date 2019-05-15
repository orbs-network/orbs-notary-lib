#!/usr/bin/env bash

heroku container:push web -a orbs-notary
heroku container:release web -a orbs-notary
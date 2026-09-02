.PHONY: send-email

POETRY ?= poetry

send-email:
	EMAIL_POSITIONS=true $(POETRY) run python algo.py

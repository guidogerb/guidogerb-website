
REGION ?= us-east-1
PROFILE ?=
AWS = aws $(if $(PROFILE),--profile $(PROFILE),)
PARAMS_DIR = params
DOMAINS = garygerber.com ggp-store.com picklecheeze.com this-is-my-story.org
define stack_name
s4c-edge-$(subst .,-,$(1))
endef
deploy-edge-%:
	$(AWS) cloudformation deploy --template-file edge-site.yaml --stack-name $(call stack_name,$*) --parameter-overrides file://$(PARAMS_DIR)/edge-$*.json --region $(REGION) --capabilities CAPABILITY_NAMED_IAM
delete-edge-%:
	$(AWS) cloudformation delete-stack --stack-name $(call stack_name,$*) --region $(REGION)
deploy-edge-all: $(addprefix deploy-edge-,$(DOMAINS))
delete-edge-all: $(addprefix delete-edge-,$(DOMAINS))
deploy-auth:
	$(AWS) cloudformation deploy --template-file auth.yaml --stack-name s4c-auth --parameter-overrides file://$(PARAMS_DIR)/auth.json --region $(REGION) --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND
deploy-api:
	$(AWS) cloudformation deploy --template-file api.yaml --stack-name s4c-api --parameter-overrides file://$(PARAMS_DIR)/api.json --region $(REGION) --capabilities CAPABILITY_NAMED_IAM
deploy-data:
	$(AWS) cloudformation deploy --template-file data.yaml --stack-name s4c-data --parameter-overrides file://$(PARAMS_DIR)/data.json --region $(REGION)
deploy-media:
	$(AWS) cloudformation deploy --template-file media-audio-video.yaml --stack-name s4c-media --parameter-overrides file://$(PARAMS_DIR)/media.json --region $(REGION) --capabilities CAPABILITY_NAMED_IAM
deploy-search:
	$(AWS) cloudformation deploy --template-file opensearch-serverless.yaml --stack-name s4c-oss --parameter-overrides file://$(PARAMS_DIR)/opensearch.json --region $(REGION)

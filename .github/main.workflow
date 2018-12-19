workflow "Deployment" {
  on = "push"
  resolves = ["\"npm pu"]
}

action "Filters for GitHub Actions" {
  uses = "actions/bin/filter@e96fd9a"
  args = "branch master"
}

action "\"npm pu" {
  uses = "actions/npm@c555744"
  needs = ["Filters for GitHub Actions"]
  args = "publish --access public"
  secrets = ["NPM_AUTH_TOKEN"]
}

---
title: Network Automation - Go, Ansible, and CodePipeline
date: 2026-06-29
excerpt: An advanced guide on securing initial switch configurations using Ansible, building custom automation tooling with Go, and wrapping it in AWS CodePipeline.
tags: Automation, Golang, Ansible, CI/CD, Networking
---

# Network Automation: Go, Ansible, and CodePipeline

Managing fleet-wide network configurations safely requires treating network configurations like application code. We can achieve this by combining Ansible for declarative configuration, Go for complex scripting, and AWS CodePipeline for deployment orchestration.

## Securing Initial Switch Scripts using Ansible

Provisioning a new switch securely prevents rogue access on day zero. Instead of manual terminal configuration, we define a golden standard in an Ansible playbook.

### The Baseline Playbook

```yaml
---
- name: Secure Initial Switch Configuration
  hosts: new_switches
  gather_facts: no
  tasks:
    - name: Disable Telnet
      cisco.ios.ios_config:
        lines:
          - transport input ssh
        parents: line vty 0 4

    - name: Configure local user with strong hashing
      cisco.ios.ios_config:
        lines:
          - username admin secret 9 $9$aVeryStrongHashStringHere

    - name: Apply standard ACLs
      cisco.ios.ios_config:
        src: standard_acls.j2
```

By storing this in Git, any change to the baseline configuration is peer-reviewed.

## Building Advanced Automation Tooling in Go

While Ansible is great for declarative state, some tasks require imperative logic, fast concurrency, or direct API integrations. This is where Golang shines.

### A Simple Go Netmiko Wrapper

```go
package main

import (
	"fmt"
	"golang.org/x/crypto/ssh"
	"log"
)

func executeCommand(client *ssh.Client, cmd string) {
	session, err := client.NewSession()
	if err != nil {
		log.Fatalf("Failed to create session: %s", err)
	}
	defer session.Close()

	output, err := session.CombinedOutput(cmd)
	if err != nil {
		log.Fatalf("Failed to run command: %s", err)
	}
	fmt.Printf("%s\n", output)
}
```

Go binaries are incredibly fast and can run parallel SSH connections to thousands of switches using goroutines.

## Orchestrating with AWS CodePipeline

To tie it all together, we deploy our Ansible playbooks and Go binaries using AWS CodePipeline.

1. **Source**: Developer pushes a branch modifying a switch configuration template.
2. **Build (CodeBuild)**: 
   - A CodeBuild container compiles the Go automation binaries.
   - Ansible-lint validates the playbooks.
   - Dry runs (check mode) are executed against staging switches.
3. **Approval**: An SNS topic alerts the network engineering team for manual approval.
4. **Deploy**: The playbooks are applied to the production fleet.

## Conclusion

Combining the declarative power of Ansible, the performance of Go, and the robust pipeline orchestration of AWS CodePipeline allows infrastructure teams to manage network appliances with software engineering rigor.

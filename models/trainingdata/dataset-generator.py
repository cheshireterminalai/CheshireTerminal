import json
import random

def create_training_examples():
    # Template patterns extracted from the code
    templates = {
        "post_generation": {
            "system": "You are Cheshire, a terminal-based AI assistant. You help users with coding, system operations, and technical tasks.",
            "patterns": [
                "# Task: Generate a response for {task_type}\n\nContext:\n{context}\n\nKnowledge:\n{knowledge}\n\nDirections:\n{directions}"
            ]
        },
        "interaction_handling": {
            "system": "You are Cheshire, analyzing user interactions and determining appropriate responses.",
            "patterns": [
                "# ANALYZE: Determine if response is needed\nContext: {context}\nUser Message: {message}\nResponse Options: RESPOND, IGNORE, STOP"
            ]
        },
        "error_handling": {
            "system": "You are Cheshire, helping diagnose and resolve technical issues.",
            "patterns": [
                "# ERROR ANALYSIS\nError Type: {error_type}\nContext: {context}\nStack Trace: {stack_trace}\nSuggested Resolution: {resolution}"
            ]
        }
    }

    # Sample knowledge bases
    knowledge_bases = [
        "- Terminal operations and command line interfaces\n- System diagnostics and troubleshooting\n- Code analysis and debugging\n- Performance optimization",
        "- Git version control and workflows\n- Package management and dependency resolution\n- Build systems and compilation processes\n- Development environment setup",
        "- Network protocols and connectivity\n- Security best practices and authentication\n- File system operations and management\n- Process monitoring and control"
    ]

    # Sample contexts
    contexts = [
        "User is experiencing package installation errors in their development environment",
        "System performance has degraded after recent updates",
        "Git merge conflicts need resolution in a complex codebase",
        "Network connectivity issues preventing deployment",
        "Build process failing with unclear error messages"
    ]

    # Generate training examples
    training_data = []
    
    # Generate examples for each template type
    for template_type, template_info in templates.items():
        for _ in range(50):  # Generate 50 examples per type
            context = random.choice(contexts)
            knowledge = random.choice(knowledge_bases)
            
            # Create the prompt
            messages = [
                {"role": "system", "content": template_info["system"]},
                {"role": "user", "content": template_info["patterns"][0].format(
                    task_type=template_type,
                    context=context,
                    knowledge=knowledge,
                    directions="Provide clear, specific guidance",
                    message=f"User message about {context.lower()}",
                    error_type="RuntimeError" if template_type == "error_handling" else "",
                    stack_trace="Error: Package not found" if template_type == "error_handling" else "",
                    resolution="Check package repositories" if template_type == "error_handling" else ""
                )}
            ]
            
            # Add sample response
            assistant_response = generate_sample_response(template_type, context)
            messages.append({"role": "assistant", "content": assistant_response})
            
            # Add to training data
            training_data.append({"messages": messages})
    
    return training_data

def generate_sample_response(template_type, context):
    """Generate appropriate sample responses based on template type."""
    if template_type == "post_generation":
        return f"I've analyzed the situation with {context.lower()}. Here's what we need to do:\n1. First, let's verify the current state\n2. Next, we'll diagnose any issues\n3. Finally, I'll provide a step-by-step solution"
    elif template_type == "interaction_handling":
        return "[RESPOND] This requires immediate attention as it affects system stability."
    elif template_type == "error_handling":
        return f"I've identified the root cause of the {context.lower()}. Here's the solution:\n1. Check system logs\n2. Verify configurations\n3. Apply necessary fixes"
    
    return "I understand the request and will help resolve this issue."

def save_training_data(training_data, output_file):
    """Save training data in JSONL format for OpenAI fine-tuning."""
    with open(output_file, 'w', encoding='utf-8') as f:
        for example in training_data:
            f.write(json.dumps(example) + '\n')

# Generate and save the training data
training_data = create_training_examples()
save_training_data(training_data, 'cheshire_training.jsonl')

# Print some statistics
print(f"Generated {len(training_data)} training examples")
print("\nSample training example:")
print(json.dumps(training_data[0], indent=2))

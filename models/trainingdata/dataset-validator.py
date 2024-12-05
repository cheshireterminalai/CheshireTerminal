import json
import sys
from typing import List, Dict, Any

def validate_training_data(filename: str) -> tuple[bool, List[str]]:
    """
    Validate the training data file for proper format and content.
    Returns (is_valid, error_messages)
    """
    errors = []
    line_number = 0
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                line_number += 1
                try:
                    # Validate JSON format
                    example = json.loads(line)
                    
                    # Validate structure
                    if 'messages' not in example:
                        errors.append(f"Line {line_number}: Missing 'messages' key")
                        continue
                    
                    messages = example['messages']
                    if not isinstance(messages, list):
                        errors.append(f"Line {line_number}: 'messages' is not a list")
                        continue
                    
                    # Validate message format
                    for msg_idx, msg in enumerate(messages):
                        if not isinstance(msg, dict):
                            errors.append(f"Line {line_number}, message {msg_idx}: Not a dictionary")
                            continue
                            
                        if 'role' not in msg or 'content' not in msg:
                            errors.append(f"Line {line_number}, message {msg_idx}: Missing required fields")
                            continue
                            
                        if msg['role'] not in ['system', 'user', 'assistant']:
                            errors.append(f"Line {line_number}, message {msg_idx}: Invalid role")
                            
                        if not isinstance(msg['content'], str) or len(msg['content'].strip()) == 0:
                            errors.append(f"Line {line_number}, message {msg_idx}: Invalid content")
                    
                    # Validate conversation flow
                    roles = [msg['role'] for msg in messages]
                    if roles[0] != 'system':
                        errors.append(f"Line {line_number}: First message must be system")
                    if roles[1] != 'user':
                        errors.append(f"Line {line_number}: Second message must be user")
                    if roles[-1] != 'assistant':
                        errors.append(f"Line {line_number}: Last message must be assistant")
                    
                except json.JSONDecodeError:
                    errors.append(f"Line {line_number}: Invalid JSON format")
                except Exception as e:
                    errors.append(f"Line {line_number}: Unexpected error: {str(e)}")
    
    except FileNotFoundError:
        errors.append(f"File not found: {filename}")
    except Exception as e:
        errors.append(f"Error reading file: {str(e)}")
    
    return len(errors) == 0, errors

def analyze_dataset(filename: str) -> Dict[str, Any]:
    """
    Analyze the dataset and return statistics
    """
    stats = {
        'total_examples': 0,
        'avg_messages_per_example': 0,
        'avg_content_length': 0,
        'role_distribution': {'system': 0, 'user': 0, 'assistant': 0},
        'unique_system_prompts': set()
    }
    
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            for line in f:
                example = json.loads(line)
                stats['total_examples'] += 1
                
                messages = example['messages']
                stats['avg_messages_per_example'] += len(messages)
                
                for msg in messages:
                    stats['role_distribution'][msg['role']] += 1
                    stats['avg_content_length'] += len(msg['content'])
                    
                    if msg['role'] == 'system':
                        stats['unique_system_prompts'].add(msg['content'])
    
        # Calculate averages
        if stats['total_examples'] > 0:
            stats['avg_messages_per_example'] /= stats['total_examples']
            stats['avg_content_length'] /= sum(stats['role_distribution'].values())
        
        # Convert set to length for JSON serialization
        stats['unique_system_prompts'] = len(stats['unique_system_prompts'])
        
    except Exception as e:
        print(f"Error analyzing dataset: {str(e)}")
        return {}
    
    return stats

def main():
    if len(sys.argv) != 2:
        print("Usage: python validate_dataset.py <filename>")
        sys.exit(1)
    
    filename = sys.argv[1]
    is_valid, errors = validate_training_data(filename)
    
    if not is_valid:
        print("Validation Failed!")
        print("\nErrors found:")
        for error in errors:
            print(f"- {error}")
        sys.exit(1)
    
    print("Validation Successful!")
    
    # Analyze dataset
    stats = analyze_dataset(filename)
    print("\nDataset Statistics:")
    print(f"Total examples: {stats['total_examples']}")
    print(f"Average messages per example: {stats['avg_messages_per_example']:.2f}")
    print(f"Average content length: {stats['avg_content_length']:.2f} characters")
    print("\nRole distribution:")
    for role, count in stats['role_distribution'].items():
        print(f"- {role}: {count}")
    print(f"\nUnique system prompts: {stats['unique_system_prompts']}")

if __name__ == "__main__":
    main()

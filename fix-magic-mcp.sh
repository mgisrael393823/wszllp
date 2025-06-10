#!/bin/bash

echo "🔧 Magic MCP Fix Script"
echo "======================"

# 1. Check if .npm-global/bin is in PATH
echo -e "\n1️⃣ Checking PATH..."
if [[ ":$PATH:" == *":$HOME/.npm-global/bin:"* ]]; then
    echo "✅ ~/.npm-global/bin is in PATH"
else
    echo "❌ ~/.npm-global/bin is NOT in PATH"
    echo "Adding to ~/.zshrc..."
    echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
    echo "✅ Added to ~/.zshrc. Run 'source ~/.zshrc' after this script."
fi

# 2. Check for 21st-dev-cli
echo -e "\n2️⃣ Looking for 21st-dev-cli..."
if command -v 21st-dev-cli &> /dev/null; then
    echo "✅ Found 21st-dev-cli at: $(which 21st-dev-cli)"
else
    echo "❌ 21st-dev-cli not found in PATH"
    # Check common locations
    if [ -f "$HOME/.npm-global/bin/21st-dev-cli" ]; then
        echo "Found at ~/.npm-global/bin/21st-dev-cli"
    fi
fi

# 3. Check for @21st-dev/magic package
echo -e "\n3️⃣ Checking @21st-dev/magic installation..."
if [ -d "$HOME/.npm-global/lib/node_modules/@21st-dev/magic" ]; then
    echo "✅ @21st-dev/magic is installed globally"
else
    echo "❌ @21st-dev/magic not found. Installing..."
    npm install -g @21st-dev/magic@latest
fi

# 4. Create magic symlink
echo -e "\n4️⃣ Creating magic symlink..."
if [ -f "$HOME/.npm-global/bin/magic" ]; then
    echo "✅ magic symlink already exists"
else
    if [ -f "$HOME/.npm-global/bin/21st-dev-cli" ]; then
        ln -s "$HOME/.npm-global/bin/21st-dev-cli" "$HOME/.npm-global/bin/magic"
        echo "✅ Created symlink: magic -> 21st-dev-cli"
    else
        echo "❌ Cannot create symlink - 21st-dev-cli not found"
    fi
fi

# 5. Create wrapper script as fallback
echo -e "\n5️⃣ Creating wrapper script..."
cat > "$HOME/.npm-global/bin/magic-mcp" << 'EOF'
#!/bin/bash
exec npx -y @21st-dev/magic@latest "$@"
EOF
chmod +x "$HOME/.npm-global/bin/magic-mcp"
echo "✅ Created wrapper script at ~/.npm-global/bin/magic-mcp"

# 6. Test the setup
echo -e "\n6️⃣ Testing Magic MCP..."
if command -v magic &> /dev/null; then
    echo "✅ 'magic' command is available"
    magic --version 2>/dev/null && echo "✅ Magic MCP responds to --version"
fi

# 7. Check Claude MCP config
echo -e "\n7️⃣ Checking Claude MCP configuration..."
CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"
if [ -f "$CONFIG_FILE" ]; then
    if grep -q "@21st-dev/magic" "$CONFIG_FILE"; then
        echo "✅ Magic MCP is configured in Claude"
        echo "Current config:"
        grep -A 7 "@21st-dev/magic" "$CONFIG_FILE" | head -10
    else
        echo "❌ Magic MCP not found in Claude config"
    fi
else
    echo "❌ Claude config file not found"
fi

echo -e "\n✨ Fix Script Complete!"
echo "========================"
echo ""
echo "Next steps:"
echo "1. Run: source ~/.zshrc"
echo "2. Restart Claude Code"
echo "3. Try using /ui in Claude Code"
echo ""
echo "If it still doesn't work, try running:"
echo "  npx @21st-dev/magic@latest --help"
echo "  claude --debug"
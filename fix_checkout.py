import re

with open('src/app/checkout/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. useCart destruct
content = content.replace(
    'const { items, subtotal, clearCart } = useCart();',
    'const { items, subtotal, clearCart, updateItemConfig } = useCart();'
)

# 2. Remove local states
content = re.sub(
    r'  // Per-item state overrides for size/weight, flavor, and notes\n  const \[itemVariants, setItemVariants\].*?\n  const \[itemFlavors, setItemFlavors\].*?\n  const \[itemNotes, setItemNotes\].*?\n',
    '',
    content,
    flags=re.DOTALL
)
content = re.sub(
    r'  // Cake messages state \(cartItemId -> message\)\n  const \[messages, setMessages\].*?\n',
    '',
    content,
    flags=re.DOTALL
)

# 3. Replace getItemPrice and dynamicSubtotal
old_price_calc = """  const getItemPrice = (item: any): number => {
    const selectedWeight =
      itemVariants[item.cartItemId] || item.variant || "500g";
    const selectedFlavour =
      itemFlavors[item.cartItemId] || item.flavor || "Classic";

    // Start with original item base price or fallback
    let itemBasePrice = item.price || 600;

    // Scale base price by weight
    if (selectedWeight && basePrices[selectedWeight]) {
      const scale = basePrices[selectedWeight] / basePrices["500g"];
      itemBasePrice = Math.round(itemBasePrice * scale);
    }

    // Add flavour premium based on the master catalogue
    const weightKg = parseWeightToNumber(selectedWeight);
    const surcharge = getFlavourSurcharge(selectedFlavour, weightKg);
    itemBasePrice += surcharge;

    return itemBasePrice;
  };

  // Dynamically calculate checkout subtotal based on current selections
  const dynamicSubtotal = items.reduce(
    (acc, item) => acc + getItemPrice(item) * item.quantity,
    0,
  );"""

new_price_calc = """  const handleUpdateItem = (item: any, field: string, value: string) => {
    const newVariant = field === 'variant' ? value : (item.variant || "500g");
    const newFlavor = field === 'flavor' ? value : (item.flavor || "Classic");
    
    // Calculate new price using basePrice
    let itemBasePrice = item.basePrice || 600;
    
    if (newVariant && basePrices[newVariant]) {
      const scale = basePrices[newVariant] / basePrices["500g"];
      itemBasePrice = Math.round(itemBasePrice * scale);
    }
    
    const weightKg = parseWeightToNumber(newVariant);
    const surcharge = getFlavourSurcharge(newFlavor, weightKg);
    const newPrice = itemBasePrice + surcharge;
    
    updateItemConfig(item.cartItemId, {
       [field]: value,
       price: newPrice
    });
  };"""

content = content.replace(old_price_calc, new_price_calc)

# 4. handlePlaceOrder map
old_map = """        items: items.map((i) => {
          const itemPrice = getItemPrice(i);
          return {
            productId: i.productId,
            quantity: i.quantity,
            weight: parseWeightToNumber(
              itemVariants[i.cartItemId] || i.variant || "",
            ),
            flavor: itemFlavors[i.cartItemId] || i.flavor || "Classic",
            messageOnCake: messages[i.cartItemId] || "",
            notes: itemNotes[i.cartItemId] || i.notes || "",
            price: itemPrice, // Override with current calculated price
          };
        }),"""

new_map = """        items: items.map((i) => {
          return {
            productId: i.productId,
            quantity: i.quantity,
            weight: parseWeightToNumber(i.variant || ""),
            flavor: i.flavor || "Classic",
            messageOnCake: i.messageOnCake || "",
            notes: i.notes || "",
            price: i.price, // Uses context synced price
          };
        }),"""
content = content.replace(old_map, new_map)

# 5. JSX Selectors and Inputs
content = re.sub(
    r'value=\{\s*itemVariants\[item.cartItemId\]\s*\|\|\s*item.variant\s*\|\|\s*"500g"\s*\}',
    'value={item.variant || "500g"}',
    content
)
content = re.sub(
    r'onChange=\{\(e\) =>\s*setItemVariants\(\{\s*\.\.\.itemVariants,\s*\[item.cartItemId\]: e.target.value,\s*\}\)\s*\}',
    'onChange={(e) => handleUpdateItem(item, "variant", e.target.value)}',
    content
)

content = re.sub(
    r'value=\{\s*itemFlavors\[item.cartItemId\]\s*\|\|\s*item.flavor\s*\|\|\s*"Classic"\s*\}',
    'value={item.flavor || "Classic"}',
    content
)
content = re.sub(
    r'onChange=\{\(e\) =>\s*setItemFlavors\(\{\s*\.\.\.itemFlavors,\s*\[item.cartItemId\]: e.target.value,\s*\}\)\s*\}',
    'onChange={(e) => handleUpdateItem(item, "flavor", e.target.value)}',
    content
)

content = re.sub(
    r'value=\{messages\[item.cartItemId\] \|\| ""\}',
    'value={item.messageOnCake || ""}',
    content
)
content = re.sub(
    r'onChange=\{\(e\) =>\s*setMessages\(\{\s*\.\.\.messages,\s*\[item.cartItemId\]: e.target.value,\s*\}\)\s*\}',
    'onChange={(e) => updateItemConfig(item.cartItemId, { messageOnCake: e.target.value })}',
    content
)

content = re.sub(
    r'value=\{itemNotes\[item.cartItemId\] \|\| item.notes \|\| ""\}',
    'value={item.notes || ""}',
    content
)
content = re.sub(
    r'onChange=\{\(e\) =>\s*setItemNotes\(\{\s*\.\.\.itemNotes,\s*\[item.cartItemId\]: e.target.value,\s*\}\)\s*\}',
    'onChange={(e) => updateItemConfig(item.cartItemId, { notes: e.target.value })}',
    content
)

# 6. Order Summary JSX
content = re.sub(
    r'itemVariants\[item.cartItemId\]\s*\|\|\s*item.variant\s*\|\|',
    'item.variant ||',
    content
)
content = re.sub(
    r'itemFlavors\[item.cartItemId\]',
    'item.flavor',
    content
)
content = re.sub(
    r'dynamicSubtotal',
    'subtotal',
    content
)

with open('src/app/checkout/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

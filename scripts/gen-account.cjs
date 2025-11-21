const fs = require('fs').promises;
const { HDNodeWallet } = require('ethers');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables:');
    console.error('- VITE_SUPABASE_URL:', !!supabaseUrl);
    console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    const count = process.argv[2] ? parseInt(process.argv[2], 10) : 50;
    const wallets = [];

    console.log(`Generating ${count} wallet accounts...`);

    for (let i = 0; i < count; i++) {
        const wallet = HDNodeWallet.createRandom();
        wallets.push({
            address: wallet.address,
            private_key: wallet.privateKey,
            public_key: wallet.publicKey,
            status: 0, // 0 = available
        });
    }

    console.log(`Generated ${wallets.length} wallets. Inserting into database...`);

    // Insert wallets into Supabase
    const { data, error } = await supabase
        .from('fake_wallets')
        .insert(wallets)
        .select('address');
    if (error) {
        console.error('Error inserting wallets:', error);
        process.exit(1);
    }

    console.log(`Successfully inserted ${data.length} wallets into the database.`);
    for (const wallet of data) {
        console.log(`- ${wallet.address}`);
    }
}

main().catch(console.error);
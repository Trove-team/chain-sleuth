// src/app/api/pipeline/token/route.ts
import 'dotenv/config';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        console.log('Attempting to fetch token with URL:', process.env.NEO4J_API_URL);
        
        const response = await fetch(`${process.env.NEO4J_API_URL}/api/v1/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.NEO4J_API_KEY || '',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Token fetch failed:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
            });
            throw new Error(`Failed to get auth token: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return NextResponse.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key'
            }
        });
    } catch (error) {
        console.error('Token generation failed:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to generate token' }, 
            { status: 500 }
        );
    }
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
            'Access-Control-Max-Age': '86400'
        }
    });
}
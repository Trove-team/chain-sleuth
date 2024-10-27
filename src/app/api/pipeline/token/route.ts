// src/app/api/pipeline/token/route.ts
import { NextResponse } from 'next/server';
import { PipelineService } from '@/services/pipelineService';

export async function POST() {
    try {
        const pipelineService = new PipelineService();
        const token = await pipelineService.getToken();
        
        return NextResponse.json({ token });
    } catch (error) {
        console.error('Token generation failed:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' }, 
            { status: 500 }
        );
    }
}
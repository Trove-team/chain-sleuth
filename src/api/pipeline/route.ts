import { Elysia, t } from "elysia";
import { PipelineService } from "../../services/pipelineService";

const pipelineService = new PipelineService();

// Change from const to export default
export default new Elysia({ prefix: "/pipeline" })
    .post("/investigate", async ({ body }) => {
        const { accountId } = body;
        
        const token = await pipelineService.getToken();
        const { taskId, existingData } = await pipelineService.startProcessing(accountId, token);
        
        if (existingData) {
            return {
                status: 'complete',
                data: existingData
            };
        }
        
        return {
            status: 'processing',
            taskId,
            token
        };
    }, {
        body: t.Object({
            accountId: t.String()
        })
    })
    .get("/status/:taskId", async ({ params, query }) => {
        const { taskId } = params;
        const { token } = query as { token: string };
        
        const status = await pipelineService.checkStatus(taskId, token);
        
        if (status.status === 'complete') {
            const metadata = await pipelineService.getMetadata(status.data.accountId, token);
            return {
                status: 'complete',
                data: metadata
            };
        }
        
        return status;
    });

interface ProgressUpdate {
    taskId: string;
    progress: number;
    status: string;
    currentStep: string;
}

let progressUpdates = new Map<string, ProgressUpdate>();

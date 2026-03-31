const Video = require('../models/Video');
const { getIO } = require('./socketService');

const processVideo = async (videoId, userId) => {
    const progressSteps = [10, 25, 50, 75, 100];

    try {
        const io = getIO();

        for (const progress of progressSteps) {

            await sleep(1000 + Math.random() * 1000);


            await Video.findByIdAndUpdate(videoId, { progress });


            io.to(`user:${userId}`).emit('video:progress', {
                videoId,
                progress,
            });
        }


        const classification = Math.random() > 0.2 ? 'safe' : 'flagged';


        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            {
                status: 'completed',
                progress: 100,
                classification,
            },
            { new: true }
        );


        io.to(`user:${userId}`).emit('video:completed', {
            videoId,
            status: 'completed',
            classification,
            video: updatedVideo,
        });

        console.log(`Video ${videoId} processed: ${classification}`);
    } catch (error) {
        console.error(`Processing failed for video ${videoId}:`, error.message);


        await Video.findByIdAndUpdate(videoId, {
            status: 'failed',
            progress: 0,
        });


        try {
            const io = getIO();
            io.to(`user:${userId}`).emit('video:failed', {
                videoId,
                error: 'Processing failed. Please try uploading again.',
            });
        } catch (_) {

        }
    }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

module.exports = { processVideo };

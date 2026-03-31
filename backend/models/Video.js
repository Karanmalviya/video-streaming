const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Video title is required'],
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: '',
        },
        originalName: {
            type: String,
            required: true,
        },
        filePath: {
            type: String,
            required: true,
        },
        mimeType: {
            type: String,
            required: true,
        },
        size: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['uploading', 'processing', 'completed', 'failed'],
            default: 'processing',
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        classification: {
            type: String,
            enum: ['pending', 'safe', 'flagged'],
            default: 'pending',
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        organizationId: {
            type: String,
            required: true,
        },
        assignedTo: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],
    },
    { timestamps: true }
);

videoSchema.index({ uploadedBy: 1 });
videoSchema.index({ organizationId: 1 });
videoSchema.index({ status: 1 });
videoSchema.index({ assignedTo: 1 });
videoSchema.index({ title: 'text', originalName: 'text' });

module.exports = mongoose.model('Video', videoSchema);

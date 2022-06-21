var auto = require('@pulumi/pulumi/automation');
var aws = require('@pulumi/aws');
const process = require('process');

const args = process.argv.slice(2);
let destroy = false;
if(args.length>0 && args[0]){
    destroy = args[0] === "destroy";
}
const run = async()=>{
    const pulumiProgram = async()=>{
        const siteBucket = new aws.s3.Bucket("s3-website-bucket",{
            website:{
                indexDocument:'index.html',
            },
        });
        const indexContent = `<html><head>
        <title>Hello</title>
        </head>
        <body><h3>Hello from aws</h3>
        </body></html>`;
        let object = new aws.s3.BucketObject("index",{
            bucket:siteBucket,
            content:indexxContent,
            contentType:'text/html; charset=utf-8',
            key:'index.html',
        });
        function publicReadPolicyForBucket(bucketName){
            return{
                Version:'2022-06-10',
                Statement:[{
                    Effect:'Allow',
                    Principal:'*',
                    Action:[
                        's3:GetObject'
                    ],
                    Resource:[
                        `arn:aws:s3:::${bucketName}/*`
                    ]
                }]
            };
        }
        new aws.s3.BucketPolicy("bucketPolicy",{
            bucket:siteBucket.bucket,
            policy:siteBucket.bucket.apply(publicReadPolicyForBucket)
        });
        return{
            websiteUrl:siteBucket.websiteEndpoint,
        };
    };
    const args = {
        stackName:'dev',
        projectName:'inlineNode',
        program:pulumiProgram
    };
    const stack = await auto.LocalWorkspace.createOrSelectStack(args);
    await stack.workspace.installPlugin('aws','v4.0.0');
    await stack.setConfig('aws:region',{value:'us-west-2'});
    await stack.refresh({onOutput:console.info});

    if(destroy){
        await stack.destroy({onOutput:console.info});
        process.exit(0);

    }
    console.info("updatingstack");
    const upRes = await stack.up({onOutput:console.info});
    console.info(`update summary:\n${JSON.stringify(upRes.summary.resourceChanges, null, 4)}`);
    console.info(`website url: ${upRes.outputs.websiteUrl.value}`);
};
run().catch(err=>console.log(err));
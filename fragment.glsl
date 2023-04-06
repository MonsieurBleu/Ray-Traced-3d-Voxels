

vec3 camdir = vec3(1.f, 0.0, 0.0);
vec3 campos = vec3(-3.f, 0.5, -2.0);
float camsize = 1.0;

int getvox_old(vec2 uv)
{
    campos.y += (0.5-uv.x)*camsize;
    campos.z += (0.5-uv.y)*camsize;

    vec3 maxp = vec3(1, 1, 1);
    vec3 minp = vec3(0, 0, 0);

    float z;
    float y;
    float x;

    bool cond1 = false;
    z = minp.z;
    y = minp.x;
    // x = sqrt(pow(camdir.y*y, 2.f) + pow(camdir.z*z, 2.f)) + campos.y + campos.z;



    // x = campos.x + camdir.x*(y - y campos.y)/camdir.y


    x = (y - campos.y)*(camdir.y/camdir.x) + (z - campos.z)*(camdir.z/camdir.x) + campos.x;
    if(x >= minp.x && x <= maxp.x)
        cond1 = true;
        

    bool cond2 = false;
    // z = minp.z;
    // x = minp.y;
    // y = sqrt(pow(camdir.x*x, 2.f) + pow(camdir.z*z, 2.f)) + campos.y;
    // if(y >= minp.x && y <= maxp.x)
    //     cond2 = true;

    if(cond1 || cond2)
        return 1;
    
    return 0;
}

int getvox(vec2 uv)
{
    campos.y += (0.5-uv.x)*camsize;
    campos.z += (0.5-uv.y)*camsize;

    vec3 maxp = vec3(1, 1, 1);
    vec3 minp = vec3(0, 0, 0);

    float halflen = 0.5;

    // x = x0 + t * a
    // y = y0 + t * b
    // z = z0 + t * c

    // t = (y-y0)/b

    float x;
    float y;
    float z;
    float t;

    bool cond1 = false;
    bool cond2 = false;
    bool cond3 = false;
    bool cond4 = false;

    x = minp.x;
    t = (x-campos.x)/camdir.x;

    y = campos.y + t*camdir.y;
    z = campos.z + t*camdir.z;

    if(y >= minp.x && y <= maxp.x)
        cond1 = true;
    
    if(z >= minp.z && z <= maxp.z)
        cond2 = true;

    x = maxp.x;
    t = (x-campos.x)/camdir.x;

    y = campos.y + t*camdir.y;
    z = campos.z + t*camdir.z;

    if(y >= minp.x && y <= maxp.x)
        cond3 = true;
    
    if(z >= minp.z && z <= maxp.z)
        cond4 = true;

    int return_val = 0; 

    if(cond1 && cond2) return_val |= 1;

    if(cond3 && cond4) return_val |= 2;


    return return_val;
}

void main()
{
    float time = iGlobalTime * 1.0;
    vec2 uv = (gl_FragCoord.xy / iResolution.xx - 0.5) * 8.0;
    gl_FragColor = vec4(0.15, 0.15, 0.15, 1.0);

    camdir.y = cos(time)*0.25;
    camdir.z = sin(time)*0.25;

    int voxel = getvox(uv);

    if((voxel&1) != 0)
    {
        gl_FragColor.r += 0.5;
    }

    if((voxel&2) != 0)
    {
        gl_FragColor.b += 0.5;
    }
}

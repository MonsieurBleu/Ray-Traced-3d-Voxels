

vec3 camdir = vec3(1.f, 0.0, 0.0);
vec3 campos = vec3(-3.f, 0.0, 0.0);
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

    bool condx1 = false;
    z = minp.z;
    y = minp.x;
    // x = sqrt(pow(camdir.y*y, 2.f) + pow(camdir.z*z, 2.f)) + campos.y + campos.z;



    // x = campos.x + camdir.x*(y - y campos.y)/camdir.y


    x = (y - campos.y)*(camdir.y/camdir.x) + (z - campos.z)*(camdir.z/camdir.x) + campos.x;
    if(x >= minp.x && x <= maxp.x)
        condx1 = true;
        

    bool condx2 = false;
    // z = minp.z;
    // x = minp.y;
    // y = sqrt(pow(camdir.x*x, 2.f) + pow(camdir.z*z, 2.f)) + campos.y;
    // if(y >= minp.x && y <= maxp.x)
    //     condx2 = true;

    if(condx1 || condx2)
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

    vec3 p;
    float t;

    int return_val = 0; 

    t = (minp.x-campos.x)/camdir.x;
    p.yz = campos.yz + t*camdir.yz;

    if(p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
        return_val |= 1;


    t = (maxp.x-campos.x)/camdir.x;
    p.yz = campos.yz + t*camdir.yz;

    if(p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
        return_val |= 1;



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
        gl_FragColor.b += 0.5;
    }

    if((voxel&2) != 0)
    {
        gl_FragColor.r += 0.5;
    }
}

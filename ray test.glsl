#define PI 3.14159265359
#define MAXSD 99999.0
#define voxside_x 1
#define voxside_y 2
#define voxside_z 3

vec2 uv;
vec3 camdir = vec3(0.0, 0.0, 0.0);
vec3 icamdir;
vec3 campos = vec3(-2.f, -5, -25);

struct Surface
{
    float sd; // signed distance value
    vec3 col; // color
    int side;
};

Surface getvox(const vec3 pos, const vec3 size)
{
    vec3 maxp = pos + size*0.5;
    vec3 minp = pos - size*0.5;
    vec3 cpicd = -campos*icamdir;
    vec3 minpicd = minp*icamdir;
    vec3 maxpicd = maxp*icamdir;

    vec3 p;
    float t;

    Surface return_val;
    return_val.col = vec3(0.75);
    return_val.sd = MAXSD;


    //////////////// X //////////////
    if(camdir.x > 0.0)
    {
        t = minpicd.x + cpicd.x;
        p.yz = campos.yz + t*camdir.yz;
        if(t < return_val.sd && p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
        {
            return_val.sd = t;
            return_val.side = voxside_x;
        }
    }
    else
    {
        t = maxpicd.x + cpicd.x;
        p.yz = campos.yz + t*camdir.yz;
        if(t < return_val.sd && p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
        {
            return_val.sd = t;
            return_val.side = voxside_x;
        }
    }

    //////////////// Y //////////////
    if(camdir.y < 0.0)
    {
        t = maxpicd.y + cpicd.y;
        p.xz = campos.xz + t*camdir.xz;
        if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.z >= minp.z && p.z <= maxp.z)
        {
            return_val.sd = t;
            return_val.side = voxside_y;
        }
    }
    else
    {
        t = minpicd.y + cpicd.y;
        p.xz = campos.xz + t*camdir.xz;
        if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.z >= minp.z && p.z <= maxp.z)
        {
            return_val.sd = t;
            return_val.side = voxside_y;
        }

    }

    //////////////// Z //////////////
    if(camdir.z > 0.0)
    {
        t = minpicd.z + cpicd.z;
        p.xy = campos.xy + t*camdir.xy;
        if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.y >= minp.y && p.y <= maxp.y)
        {
            return_val.sd = t;
            return_val.side = voxside_z;
        }
    }
    else
    {
        t = maxpicd.z + cpicd.z;
        p.xy = campos.xy + t*camdir.xy;
        if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.y >= minp.y && p.y <= maxp.y)
        {
            return_val.sd = t;
            return_val.side = voxside_z;
        }
    }

    return return_val;
}

mat3 camera(vec3 cameraPos, vec3 lookAtPoint) {
	vec3 cd = normalize(lookAtPoint - cameraPos); // camera direction
	vec3 cr = normalize(cross(vec3(0, 1, 0), cd)); // camera right
	vec3 cu = normalize(cross(cd, cr)); // camera up
	
	return mat3(-cr, cu, -cd);
}

// Rotate around a circular path
mat2 rotate2d(float theta) {
  float s = sin(theta), c = cos(theta);
  return mat2(c, -s, s, c);
}

Surface compSurface(Surface s1, Surface s2)
{
    // if(s1.sd == MAXSD) return s2;

    if(s1.sd <= s2.sd)
        return s1;
    else
        return s2;
}

void sorthoctSurface(Surface s[8]) // old
{
    float tmp;
    for(int i = 0; i < 8; i++)
    {
        float minsd = s[i].sd;

        for(int j = i; j < 8; j++)
        {
            if(minsd > s[j].sd)
            {
                tmp = s[i].sd;
                s[i].sd = s[j].sd;
                s[j].sd = tmp;
                minsd = s[i].sd;
            }
        }
    }
}

void main()
{
    uv = (gl_FragCoord.xy-iResolution.xy*0.5)/iResolution.xx;
    vec2 mouseUV = iMouse.xy/iResolution.xy; // Range: <0, 1>
    mouseUV.x += iTime*0.01;
    vec3 backgroundColor = vec3(0.835, 1, 1);

    vec3 col = vec3(0);
    vec3 lp = vec3(0, 0, 0); // lookat point (aka camera target)
    vec3 ro = vec3(3, 10, 10); // ray origin that represents camera position

    float cameraRadius = 7.0;
    ro.yz = ro.yz * cameraRadius * rotate2d(mix(PI/2., 0., mouseUV.y));
    ro.xz = ro.xz * rotate2d(mix(-PI, PI, mouseUV.x)) + vec2(lp.x, lp.z);

    vec3 rd = camera(ro, lp) * normalize(vec3(uv, -1)); // ray direction

    campos = ro;
    camdir = rd;
    icamdir = 1.0/camdir;
    ivec3 s = ivec3(20);
    ivec3 sh = s/2; 

    vec3 worldorigin = vec3(0.0);
    vec3 worldsize = vec3(s.x*2-1,s.y*2-1,s.z*2-1);
    vec3 worldhsize = worldsize*0.50;
    vec3 worldqsize = worldsize*0.25;

    // check if the ray is out of the world
    // Surface world = getvox(worldorigin, worldsize);
    // if(world.sd == MAXSD) discard;

    Surface subvoxels[8];
    vec3 subworldorigin[8];
    subworldorigin[0] = vec3(worldorigin.x - worldqsize.x, worldorigin.y - worldqsize.y, worldorigin.z - worldqsize.z);
    subworldorigin[1] = vec3(worldorigin.x - worldqsize.x, worldorigin.y - worldqsize.y, worldorigin.z + worldqsize.z);
    subworldorigin[2] = vec3(worldorigin.x - worldqsize.x, worldorigin.y + worldqsize.y, worldorigin.z - worldqsize.z);
    subworldorigin[3] = vec3(worldorigin.x - worldqsize.x, worldorigin.y + worldqsize.y, worldorigin.z + worldqsize.z);
    subworldorigin[4] = vec3(worldorigin.x + worldqsize.x, worldorigin.y - worldqsize.y, worldorigin.z - worldqsize.z);
    subworldorigin[5] = vec3(worldorigin.x + worldqsize.x, worldorigin.y - worldqsize.y, worldorigin.z + worldqsize.z);
    subworldorigin[6] = vec3(worldorigin.x + worldqsize.x, worldorigin.y + worldqsize.y, worldorigin.z - worldqsize.z);
    subworldorigin[7] = vec3(worldorigin.x + worldqsize.x, worldorigin.y + worldqsize.y, worldorigin.z + worldqsize.z);
    subvoxels[0] = getvox(subworldorigin[0], worldhsize);
    subvoxels[1] = getvox(subworldorigin[1], worldhsize);
    subvoxels[2] = getvox(subworldorigin[2], worldhsize);
    subvoxels[3] = getvox(subworldorigin[3], worldhsize);
    subvoxels[4] = getvox(subworldorigin[4], worldhsize);
    subvoxels[5] = getvox(subworldorigin[5], worldhsize);
    subvoxels[6] = getvox(subworldorigin[6], worldhsize);
    subvoxels[7] = getvox(subworldorigin[7], worldhsize);

    // Sorting subvoxels
    Surface tmp;
    vec3 vtmp;
    for(int i = 0; i < 4; i++) // We only want the 4 mins distances
    {
        float minsd = subvoxels[i].sd;

        for(int j = i; j < 8; j++)
        {
            if(minsd > subvoxels[j].sd)
            {
                tmp = subvoxels[i];
                subvoxels[i] = subvoxels[j];
                subvoxels[j] = tmp;
                minsd = subvoxels[i].sd;

                vtmp = subworldorigin[i];
                subworldorigin[i] = subworldorigin[j];
                subworldorigin[j] = vtmp;
            }
        }
    }

    Surface voxel;
    Surface newvoxel;
    voxel.sd  = MAXSD;
    voxel.col = vec3(0.0, 0.5, 0.5);
    
    for(int i = 0; i < 4; i++)
    {
        if(subvoxels[i].sd == MAXSD) continue;
        if(subvoxels[i].sd >= voxel.sd) continue;

        worldorigin = subworldorigin[i];

        for(int z = 0; z < sh.z; z++)
        for(int y = 0; y < sh.y; y++)
        for(int x = 0; x < sh.x; x++)
        {
            newvoxel = getvox(
            worldorigin + vec3(
                float(x*2 - sh.x) + 1.0,  
                float(y*2 - sh.y) + 1.0, 
                float(z*2 - sh.z) + 1.0), 
            vec3(1.0, 1.0, 1.0));

            if(newvoxel.sd < voxel.sd) 
                voxel = newvoxel;
        }

        if(voxel.sd < MAXSD) break;
    }

    gl_FragColor.rgb = voxel.col;

    vec3 voxside_colodr = vec3(0.85, 1.0, 0.75);
    switch(voxel.side)
    {
        case voxside_x : gl_FragColor *= voxside_colodr.x; break;
        case voxside_y : gl_FragColor *= voxside_colodr.y; break;
        case voxside_z : gl_FragColor *= voxside_colodr.z; break;
    }

    gl_FragColor.a = 1.0;
}

///// BENCH
// 11 : 13 ms
// 11 : 95 fps 10-11 ms
// 11 : 100 fps 9-10 ms
// 11 : 144 fps 7 ms => cap atteint

// 13 : 102 fps 10-9 ms

// 16 : 47fps 20-21ms 
// 16 : 56fps 18ms 
// 16 : 144fps 7ms 

// 25 : 80fps 13ms
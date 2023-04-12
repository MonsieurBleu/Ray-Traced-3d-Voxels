#define PI 3.14159265359
#define MAXSD 200000.0
#define voxside_x 1
#define voxside_y 2
#define voxside_z 3
#define MAX_OCTDEPTH 6

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

struct OctNode
{
    bool is_node;
    vec3 col;


};

struct trace_recstat
{
    Surface subvoxels[8];
    vec3 suborigin[8];
    vec3 size;
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

trace_recstat getSubVoxels(vec3 origin, vec3 size)
{
    trace_recstat s;

    vec3 hsize = size*0.5;
    vec3 qsize = size*0.25;

    s.size = hsize;

    s.suborigin[0] = vec3(origin.x - qsize.x, origin.y - qsize.y, origin.z - qsize.z);
    s.suborigin[1] = vec3(origin.x - qsize.x, origin.y - qsize.y, origin.z + qsize.z);
    s.suborigin[2] = vec3(origin.x - qsize.x, origin.y + qsize.y, origin.z - qsize.z);
    s.suborigin[3] = vec3(origin.x - qsize.x, origin.y + qsize.y, origin.z + qsize.z);
    s.suborigin[4] = vec3(origin.x + qsize.x, origin.y - qsize.y, origin.z - qsize.z);
    s.suborigin[5] = vec3(origin.x + qsize.x, origin.y - qsize.y, origin.z + qsize.z);
    s.suborigin[6] = vec3(origin.x + qsize.x, origin.y + qsize.y, origin.z - qsize.z);
    s.suborigin[7] = vec3(origin.x + qsize.x, origin.y + qsize.y, origin.z + qsize.z);
    s.subvoxels[0] = getvox(s.suborigin[0], hsize);
    s.subvoxels[1] = getvox(s.suborigin[1], hsize);
    s.subvoxels[2] = getvox(s.suborigin[2], hsize);
    s.subvoxels[3] = getvox(s.suborigin[3], hsize);
    s.subvoxels[4] = getvox(s.suborigin[4], hsize);
    s.subvoxels[5] = getvox(s.suborigin[5], hsize);
    // s.subvoxels[6] = getvox(s.suborigin[6], hsize);
    // s.subvoxels[7] = getvox(s.suborigin[7], hsize);

    s.subvoxels[6].sd = MAXSD;
    s.subvoxels[7].sd = MAXSD;

    s.subvoxels[0].col = vec3(0.0, 0.0, 0.0)+0.25;
    s.subvoxels[1].col = vec3(0.0, 0.0, 0.5)+0.25;
    s.subvoxels[2].col = vec3(0.0, 0.5, 0.0)+0.25;
    s.subvoxels[3].col = vec3(0.0, 0.5, 0.5)+0.25;
    s.subvoxels[4].col = vec3(0.5, 0.0, 0.0)+0.25;
    s.subvoxels[5].col = vec3(0.5, 0.0, 0.5)+0.25;
    s.subvoxels[6].col = vec3(0.5, 0.5, 0.0)+0.25;
    s.subvoxels[7].col = vec3(0.5, 0.5, 0.5)+0.25;

    //Sorting subvoxels
    Surface tmp;
    vec3 vtmp;
    for(int i = 0; i < 4; i++) // We only want the 4 mins distances
    {
        float minsd = s.subvoxels[i].sd;

        for(int j = i; j < 8; j++)
        {
            if(minsd > s.subvoxels[j].sd)
            {
                tmp = s.subvoxels[i];
                s.subvoxels[i] = s.subvoxels[j];
                s.subvoxels[j] = tmp;
                minsd = s.subvoxels[i].sd;

                vtmp = s.suborigin[i];
                s.suborigin[i] = s.suborigin[j];
                s.suborigin[j] = vtmp;
            }
        }
    }

    return s;
}

Surface trace(vec3 origin, vec3 size, int depth)
{
    trace_recstat stack[MAX_OCTDEPTH+1];
    stack[0] = getSubVoxels(origin, size);
    int i[MAX_OCTDEPTH+1];
    
    i[0] = 0;

    Surface voxel;
    voxel.sd = MAXSD;

    for(i[depth] = 0; i[depth] < 8; i[depth]++)
    {
        if(stack[depth].subvoxels[i[depth]].sd < voxel.sd)
        {
            if(depth == MAX_OCTDEPTH)
            {
                return stack[depth].subvoxels[i[depth]];
            }
            else
            {
                stack[depth+1] = getSubVoxels(stack[depth].suborigin[i[depth]], stack[depth].size);
                depth++;
                i[depth] = -1;
            }
        }

        if(depth > 0 && i[depth] == 7)
        {
            //i[depth] = 0;
            depth--;
        }
    }

    return voxel;
}


void main()
{
    uv = (gl_FragCoord.xy-iResolution.xy*0.5)/iResolution.xx;
    vec2 mouseUV = iMouse.xy/iResolution.xy; // Range: <0, 1>
    mouseUV.x += iTime*0.01;
    vec3 backgroundColor = vec3(0.1, 0.5, 0.5);

    vec3 col = vec3(0);
    vec3 lp = vec3(0, 0, 0); // lookat point (aka camera target)
    vec3 ro = vec3(3, 10, 10); // ray origin that represents camera position

    float cameraRadius = 7000.0;
    ro.yz = ro.yz * cameraRadius * rotate2d(mix(PI/2., 0., mouseUV.y));
    ro.xz = ro.xz * rotate2d(mix(-PI, PI, mouseUV.x)) + vec2(lp.x, lp.z);

    vec3 rd = camera(ro, lp) * normalize(vec3(uv, -1)); // ray direction

    campos = ro;
    camdir = rd;
    icamdir = 1.0/camdir;

    vec3 worldorigin = vec3(0.0);
    vec3 worldsize = vec3(50000);
    vec3 worldhsize = worldsize*0.50;
    vec3 worldqsize = worldsize*0.25;

    // check if the ray is out of the world
    // Surface world = getvox(worldorigin, worldsize);
    // if(world.sd == MAXSD) discard;

    Surface voxel = trace(worldorigin, worldsize, 0);

    if(voxel.sd < MAXSD)
    {
        gl_FragColor.rgb = voxel.col;

        vec3 voxside_colodr = vec3(0.85, 1.0, 0.75);
        switch(voxel.side)
        {
            case voxside_x : gl_FragColor *= voxside_colodr.x; break;
            case voxside_y : gl_FragColor *= voxside_colodr.y; break;
            case voxside_z : gl_FragColor *= voxside_colodr.z; break;
        }

    }
    else
        discard;
        // gl_FragColor.rgb = backgroundColor;

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
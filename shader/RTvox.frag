#version 460

layout (location = 0) uniform ivec2 iResolution;
layout (location = 1) uniform float iTime;
layout (location = 2) uniform vec3 CameraPositon;
layout (location = 3) uniform vec2 MousePositon;

struct OctNode
{
    uint col;
    int  childs[8];
    int  parent;
};

#define OCTREE_CHUNK_SIZE 0xFFFF
layout (std430, binding=2) readonly restrict buffer shader_data
{
    OctNode World[OCTREE_CHUNK_SIZE];
};
// OctNode World[32];

out vec4 frag_color;

#define PI 3.14159265359
#define MAXSD 200000.0
#define voxside_x 1
#define voxside_y 2
#define voxside_z 3
#define MAX_OCTDEPTH 10

const uint LEAF_LIMIT = uint(0x80000000);

vec2 uv;
vec3 camdir = vec3(0.0, 0.0, 0.0);
vec3 icamdir;
vec3 campos = CameraPositon;

struct Surface
{
    float sd; // signed distance value
    uint col;
    int side;
};

struct trace_recstat
{
    Surface subvoxels[4];
    vec3 suborigin[4];
    int nodes[4];
    vec3 size;
    int curNode;
    // OctNode node;

    //lowp int sorted_id[8];
};

trace_recstat stack[MAX_OCTDEPTH+1];

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

void getSubVoxels(int depth, vec3 origin, vec3 size)
{
    vec3 hsize = size*0.5;
    vec3 qsize = size*0.25;

    stack[depth].size = hsize;

    OctNode node = World[stack[depth].curNode];

    // INITIALIZATION
    int cnt = 0;
    lowp int id[4];
    Surface sd[4];
    sd[0].sd = MAXSD;
    sd[1].sd = MAXSD;
    sd[2].sd = MAXSD;
    sd[3].sd = MAXSD;
    id[0] = 0;
    id[1] = 0;
    id[2] = 0;
    id[3] = 0;

    vec3 suborigin[8];
    suborigin[0] = vec3(origin.x - qsize.x, origin.y - qsize.y, origin.z - qsize.z);
    suborigin[1] = vec3(origin.x - qsize.x, origin.y - qsize.y, origin.z + qsize.z);
    suborigin[2] = vec3(origin.x - qsize.x, origin.y + qsize.y, origin.z - qsize.z);
    suborigin[3] = vec3(origin.x - qsize.x, origin.y + qsize.y, origin.z + qsize.z);
    suborigin[4] = vec3(origin.x + qsize.x, origin.y - qsize.y, origin.z - qsize.z);
    suborigin[5] = vec3(origin.x + qsize.x, origin.y - qsize.y, origin.z + qsize.z);
    suborigin[6] = vec3(origin.x + qsize.x, origin.y + qsize.y, origin.z - qsize.z);
    suborigin[7] = vec3(origin.x + qsize.x, origin.y + qsize.y, origin.z + qsize.z);

    // GETTING COLLISION WITH RAY
    for(int i = 0; i < 8 && cnt < 4; i++)
        if(node.childs[i] != 0)
        {
            sd[cnt] = getvox(suborigin[i], hsize);

            if(sd[cnt].sd != MAXSD)
            {
                id[cnt] = i;
                cnt++;
            }
        }

    // SORTING RESULT
    if(sd[0].sd >= sd[1].sd)
    {
        Surface   tmp = sd[0]; sd[0] = sd[1]; sd[1] = tmp;
        lowp int stmp = id[0]; id[0] = id[1]; id[1] = stmp;
    }
    if(sd[2].sd >= sd[3].sd)
    {
        Surface   tmp = sd[2]; sd[2] = sd[3]; sd[3] = tmp;
        lowp int stmp = id[2]; id[2] = id[3]; id[3] = stmp;
    }
    if(sd[0].sd >= sd[2].sd)
    {
        Surface   tmp = sd[0]; sd[0] = sd[2]; sd[2] = tmp;
        lowp int stmp = id[0]; id[0] = id[2]; id[2] = stmp;
    }
    if(sd[1].sd >= sd[3].sd)
    {
        Surface   tmp = sd[1]; sd[1] = sd[3]; sd[3] = tmp;
        lowp int stmp = id[1]; id[1] = id[3]; id[3] = stmp;
    }
    if(sd[1].sd >= sd[2].sd)
    {
        Surface   tmp = sd[1]; sd[1] = sd[2]; sd[2] = tmp;
        lowp int stmp = id[1]; id[1] = id[2]; id[2] = stmp;
    }

    // APPLYING SORTED RESULT
    for(int i = 0; i < 4; i++)
    {
        stack[depth].subvoxels[i] = sd[i];
        if(sd[i].sd < MAXSD)
        {
            stack[depth].suborigin[i] = suborigin[id[i]];
            stack[depth].nodes[i] = node.childs[id[i]];
        }
    }
}

Surface trace(vec3 origin, vec3 size, int depth)
{
    getSubVoxels(0, origin, size);
    int i[MAX_OCTDEPTH+1];
    
    i[0] = 0;

    Surface voxel;
    voxel.sd = MAXSD;

    stack[depth].curNode = 0;

    for(i[depth] = 0; i[depth] < 4; i[depth]++)
    {
        Surface csvoxel = stack[depth].subvoxels[i[depth]];
        if(csvoxel.sd < voxel.sd && csvoxel.sd > 0.0)
        {
            // if(depth == MAX_OCTDEPTH || csvoxel.sd > 100000.0)
            // int maxd = MAX_OCTDEPTH ;
            int maxd = MAX_OCTDEPTH - int((csvoxel.sd/5000.0));
            if(maxd < 4) maxd = 4;
            if(depth >= maxd)
            {   
                csvoxel.col = World[stack[depth].curNode].col;
                return csvoxel;
            }

            uint col = uint(stack[depth].nodes[i[depth]]);

            // if(depth == MAX_OCTDEPTH || node.is_leaf)
            if(col >= LEAF_LIMIT)
            {
                csvoxel.col = col;
                return csvoxel;
            }

            else
            {
                stack[depth+1].curNode = stack[depth].nodes[i[depth]];
                getSubVoxels(depth+1, stack[depth].suborigin[i[depth]], stack[depth].size);
                depth++;
                i[depth] = -1;
            }
        }

        if(depth > 0 && i[depth] == 3)
        {
            // i[depth] = -1;
            depth--;
        }
    }

    return voxel;
}

// void test()
// {
//     World[1].col = 0x21c78b;
//     World[0].col= 0x21c78b;
//     for(int i = 0; i < 6; i++)
//     {   
//         World[0].childs[i] = 1;
//         World[1].childs[i] = 1;
//     }
// }

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main()
{
    uv = (gl_FragCoord.xy-iResolution.xy*0.5)/iResolution.xx;
    // vec2 mouseUV = iMouse.xy/iResolution.xy; // Range: <0, 1>
    // vec2 mouseUV = vec2(0.5, 0.75);
    // mouseUV.x -= iTime*0.1;
    // mouseUV.y = iTime*0.1;
    vec2 mouseUV = MousePositon/iResolution.xy;
    vec3 backgroundColor = vec3(101.f, 194.f, 245.f)/256.f;

    vec3 col = vec3(0);
    vec3 lp = vec3(0, 0, 0); // lookat point (aka camera target)
    // lp.x = cos(iTime)*5000.0;
    // lp.z = sin(iTime)*5000.0;
    vec3 ro = vec3(3, 10, 10); // ray origin that represents camera position

    float cameraRadius = 1.0;
    ro.yz = ro.yz * cameraRadius * rotate2d(mix(PI/2., 0., mouseUV.y));
    ro.xz = ro.xz * rotate2d(mix(-PI, PI, mouseUV.x)) + vec2(lp.x, lp.z);

    vec3 rd = camera(ro, lp) * normalize(vec3(uv, -1)); // ray direction

    ro.zy = ro.yz;
    rd.zy = rd.yz;

    // campos.x = cos(iTime)*50000.0;
    campos += ro;
    camdir = rd;
    icamdir = 1.0/camdir;

    vec3 worldorigin = vec3(0.0);
    vec3 worldsize = vec3(50000);
    vec3 worldhsize = worldsize*0.50;
    vec3 worldqsize = worldsize*0.25;

    // check if the ray is out of the world
    Surface world = getvox(worldorigin, worldsize);
    if(world.sd == MAXSD) discard;

    Surface voxel = trace(worldorigin, worldsize, 0);

    if(voxel.sd < MAXSD)
    {
        // voxel.col = uint(voxel.sd);
        uint r = (voxel.col>>uint(16))%uint(256);
        uint g = (voxel.col>>uint(8))%uint(256);
        uint b = (voxel.col)%uint(256);
        // vec3 vcol = vec3(float(r), float(g), float(b))/256.0;

        // cool depth visualisation
        r = uint(voxel.sd/512.0);
        g = 175;
        b = 175;
        vec3 vcol = hsv2rgb(vec3(float(r), float(g), float(b))/256.0);

        frag_color.rgb = vcol;

        vec3 voxside_colodr = vec3(0.85, 1.0, 0.75);
        switch(voxel.side)
        {
            case voxside_x : frag_color *= voxside_colodr.x; break;
            case voxside_y : frag_color *= voxside_colodr.y; break;
            case voxside_z : frag_color *= voxside_colodr.z; break;
        }

    }
    else discard;
        //frag_color.rgb = backgroundColor;

    // for(int i = 0; i < 16; i++)
    // if(test[0xFF-1].parent != 69)
    //     discard;

    frag_color.a = 1.0;
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
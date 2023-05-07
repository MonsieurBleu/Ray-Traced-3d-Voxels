#version 450

#define GETVOX_VISUALIZATION
// #define DO_LODS

layout (location = 0) uniform ivec2 iResolution;
layout (location = 1) uniform float iTime;
layout (location = 2) uniform vec3  CameraPositon;
layout (location = 3) uniform vec3  CameraDirection;
layout (location = 4) uniform vec2  polardir;
layout (location = 5) uniform float FOV;

struct OctNode
{
    uint col;
    int  childs[8];
    int  parent;
};

#define OCTREE_CHUNK_SIZE 0xFFFFFF
// layout (std430, binding=2) readonly restrict buffer shader_data
layout (std430, binding=2) readonly buffer shader_data
{
    // OctNode World[OCTREE_CHUNK_SIZE];
    OctNode World[];
};
// OctNode World[32];

out vec4 frag_color;

#define PI 3.14159265359
#define MAXSD 900000.0
#define voxside_x 1
#define voxside_y 2
#define voxside_z 3
#define MAX_OCTDEPTH 9

const uint LEAF_LIMIT = uint(0x80000000);

vec2 uv;
vec3 camdir = vec3(0.0, 0.0, 0.0);
vec3 icamdir;
vec3 campos = CameraPositon;

struct Surface
{
    float sd; // signed distance value
    uint col;
    lowp int side;
};

struct trace_recstat
{
    Surface subvoxels[4];
    vec3 suborigin[4];
    int nodes[4];
    float size;
    int curNode;
};

trace_recstat stack[MAX_OCTDEPTH];

// trace_recstat stack[MAX_OCTDEPTH] = {
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0},
//         {{{0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}, {0.0, 0, 0}}, {{0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}, {0.0, 0.0, 0.0}}, {0, 0, 0, 0}, 0.0, 0}
//     };

#ifdef GETVOX_VISUALIZATION
uint getvoxcnt = 0;
#endif

Surface getvox(const vec3 pos, const float hsize)
{
    #ifdef GETVOX_VISUALIZATION
    getvoxcnt ++;
    #endif

    vec3 maxp = pos + hsize;
    vec3 minp = pos - hsize;
    vec3 cpicd = -campos*icamdir;
    vec3 minpicd = minp*icamdir;
    vec3 maxpicd = maxp*icamdir;

    Surface return_val;
    return_val.sd = MAXSD;

    // https://tavianator.com/2011/ray_box.html

    float tx1 = minpicd.x+cpicd.x;
    float tx2 = maxpicd.x+cpicd.x;
    float tmin = min(tx1, tx2);
    float tmax = max(tx1, tx2);

    float ty1 = minpicd.y+cpicd.y;
    float ty2 = maxpicd.y+cpicd.y;
    tmin = max(tmin, min(ty1, ty2));
    tmax = min(tmax, max(ty1, ty2));

    float tz1 = minpicd.z+cpicd.z;
    float tz2 = maxpicd.z+cpicd.z;
    tmin = max(tmin, min(tz1, tz2));
    tmax = min(tmax, max(tz1, tz2));

    if(tmax >= tmin && tmax > 0.0)
        return_val.sd = tmin;
    // else 
    //     return return_val;
    
    // if(return_val.sd == tx1 || return_val.sd == tx2)
    //     return_val.side = voxside_x;

    // if(return_val.sd == ty1 || return_val.sd == ty2)
    //     return_val.side = voxside_y;

    // if(return_val.sd == tz1 || return_val.sd == tz2)
    //     return_val.side = voxside_z;

    return return_val;
}

Surface getvox_old2(const vec3 pos, const float size)
{
    #ifdef GETVOX_VISUALIZATION
    getvoxcnt ++;
    #endif

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
    t = minpicd.x + cpicd.x;
    p.yz = campos.yz + t*camdir.yz;
    if(t < return_val.sd && p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
    {
        return_val.sd = t;
        return_val.side = voxside_x;
    }
    t = maxpicd.x + cpicd.x;
    p.yz = campos.yz + t*camdir.yz;
    if(t < return_val.sd && p.y >= minp.y && p.y <= maxp.y && p.z >= minp.z && p.z <= maxp.z)
    {
        return_val.sd = t;
        return_val.side = voxside_x;
    }

    //////////////// Y //////////////

    t = maxpicd.y + cpicd.y;
    p.xz = campos.xz + t*camdir.xz;
    if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.z >= minp.z && p.z <= maxp.z)
    {
        return_val.sd = t;
        return_val.side = voxside_y;
    }

    t = minpicd.y + cpicd.y;
    p.xz = campos.xz + t*camdir.xz;
    if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.z >= minp.z && p.z <= maxp.z)
    {
        return_val.sd = t;
        return_val.side = voxside_y;
    }

    //////////////// Z //////////////
    t = minpicd.z + cpicd.z;
    p.xy = campos.xy + t*camdir.xy;
    if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.y >= minp.y && p.y <= maxp.y)
    {
        return_val.sd = t;
        return_val.side = voxside_z;
    }

    t = maxpicd.z + cpicd.z;
    p.xy = campos.xy + t*camdir.xy;
    if(t < return_val.sd && p.x >= minp.x && p.x <= maxp.x && p.y >= minp.y && p.y <= maxp.y)
    {
        return_val.sd = t;
        return_val.side = voxside_z;
    }

    // if(return_val.sd < 0.0)
    //     return_val.sd = MAXSD;

    return return_val;
}

Surface getvox_old(const vec3 pos, const float size)
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

void getSubVoxels(int depth, vec3 origin, float size)
{
    float hsize = size*0.5;
    float qsize = size*0.25;

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
    suborigin[0] = vec3(origin.x - qsize, origin.y - qsize, origin.z - qsize);
    suborigin[1] = vec3(origin.x - qsize, origin.y - qsize, origin.z + qsize);
    suborigin[2] = vec3(origin.x - qsize, origin.y + qsize, origin.z - qsize);
    suborigin[3] = vec3(origin.x - qsize, origin.y + qsize, origin.z + qsize);
    suborigin[4] = vec3(origin.x + qsize, origin.y - qsize, origin.z - qsize);
    suborigin[5] = vec3(origin.x + qsize, origin.y - qsize, origin.z + qsize);
    suborigin[6] = vec3(origin.x + qsize, origin.y + qsize, origin.z - qsize);
    suborigin[7] = vec3(origin.x + qsize, origin.y + qsize, origin.z + qsize);

    Surface t;


    // GETTING COLLISION WITH RAY

    for(int i = 0; i < 8; i++)
    {
        // if(node.childs[i] != 0)
        // {
            t = getvox(suborigin[i], qsize);

            if(node.childs[i] != 0 && t.sd < MAXSD)
            {
                id[cnt] = i;
                sd[cnt] = t;
                cnt++;
            }
        // }
    }

    // if(node.childs[0] != 0)
    // {
    //     t = getvox(suborigin[0], qsize);

    //     if(t.sd != MAXSD)
    //     {
    //         id[cnt] = 0;
    //         sd[cnt] = t;
    //         cnt++;
    //     }
    // }
    // if(node.childs[1] != 0)
    // {
    //     t = getvox(suborigin[1], qsize);

    //     if(t.sd != MAXSD)
    //     {
    //         id[cnt] = 1;
    //         sd[cnt] = t;
    //         cnt++;
    //     }
    // }
    // if(node.childs[2] != 0)
    // {
    //     t = getvox(suborigin[2], qsize);

    //     if(t.sd != MAXSD)
    //     {
    //         id[cnt] = 2;
    //         sd[cnt] = t;
    //         cnt++;
    //     }
    // }
    // if(node.childs[3] != 0)
    // {
    //     t = getvox(suborigin[3], qsize);

    //     if(t.sd != MAXSD)
    //     {
    //         id[cnt] = 3;
    //         sd[cnt] = t;
    //         cnt++;
    //     }
    // }
    // if(node.childs[4] != 0)
    // {
    //     t = getvox(suborigin[4], qsize);

    //     if(t.sd != MAXSD)
    //     {
    //         id[cnt] = 4;
    //         sd[cnt] = t;
    //         cnt++;
    //     }
    // }
    // if(node.childs[5] != 0)
    // {
    //     t = getvox(suborigin[5], qsize);

    //     if(t.sd != MAXSD)
    //     {
    //         id[cnt] = 5;
    //         sd[cnt] = t;
    //         cnt++;
    //     }
    // }
    // if(node.childs[6] != 0)
    // {
    //     t = getvox(suborigin[6], qsize);

    //     if(t.sd != MAXSD)
    //     {
    //         id[cnt] = 6;
    //         sd[cnt] = t;
    //         cnt++;
    //     }
    // }
    // if(node.childs[7] != 0)
    // {
    //     t = getvox(suborigin[7], qsize);

    //     if(t.sd != MAXSD)
    //     {
    //         id[cnt] = 7;
    //         sd[cnt] = t;
    //         cnt++;
    //     }
    // }


    // SORTING RESULT
    if(sd[0].sd > sd[1].sd)
    {
        Surface   tmp = sd[0]; sd[0] = sd[1]; sd[1] = tmp;
        lowp int stmp = id[0]; id[0] = id[1]; id[1] = stmp;
    }
    if(sd[2].sd > sd[3].sd)
    {
        Surface   tmp = sd[2]; sd[2] = sd[3]; sd[3] = tmp;
        lowp int stmp = id[2]; id[2] = id[3]; id[3] = stmp;
    }
    if(sd[0].sd > sd[2].sd)
    {
        Surface   tmp = sd[0]; sd[0] = sd[2]; sd[2] = tmp;
        lowp int stmp = id[0]; id[0] = id[2]; id[2] = stmp;
    }
    if(sd[1].sd > sd[3].sd)
    {
        Surface   tmp = sd[1]; sd[1] = sd[3]; sd[3] = tmp;
        lowp int stmp = id[1]; id[1] = id[3]; id[3] = stmp;
    }
    if(sd[1].sd > sd[2].sd)
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

Surface trace(vec3 origin, float size, int depth)
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
        if(csvoxel.sd < MAXSD)
        {
            #ifdef DO_LODS
            
            int maxd = MAX_OCTDEPTH - int(distance(stack[depth].suborigin[i[depth]], campos)*0.00004);
            if(maxd < 0) maxd = 0;
            
            #else

            int maxd = MAX_OCTDEPTH ;

            #endif


            if(depth >= maxd)
            {  
                csvoxel.col = World[stack[depth-1].curNode].col;
                return csvoxel;
            }

            uint col = uint(stack[depth].nodes[i[depth]]);

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

// given spherical coordinates (theta, phi) of a normal vector (OR longitude and latitude)
// find the normal vector, and two vectors that are perpendicular to it (and each other)
// that lie on the plane defined by the normal vector
void findUV(in float th, in float ph, out vec3 dir, out vec3 u, out vec3 v) {
	dir = vec3(sin(th)*cos(ph), cos(th), sin(th)*sin(ph));
	// Second direction, V of the plane, is PI/2 upwards towards the north pole
	float thV, phV;
	if(th < 0.5*PI) {
		thV = 0.5*PI - th;
		phV = mod(ph + PI, 2.0*PI);
	} else {
		thV = th - 0.5*PI;
		phV = ph;
	}
	v = vec3(sin(thV)*cos(phV), cos(thV), sin(thV)*sin(phV));
	// Third direction, U of plane, is perpendicular to both
	u = cross(dir, v);
}

// the bad example from IQ's article, Haha!
// https://iquilezles.org/articles/noacos
mat3 rotationAxisAngle( vec3 v, float angle )
{
    float s = sin( angle );
    float c = cos( angle );
    float ic = 1.0 - c;

    return mat3( v.x*v.x*ic + c,     v.y*v.x*ic - s*v.z, v.z*v.x*ic + s*v.y,
                 v.x*v.y*ic + s*v.z, v.y*v.y*ic + c,     v.z*v.y*ic - s*v.x,
                 v.x*v.z*ic - s*v.y, v.y*v.z*ic + s*v.x, v.z*v.z*ic + c );
}

void main()
{
    frag_color = vec4(0.0);
    uv = (gl_FragCoord.xy-iResolution.xy*0.5)/iResolution.xx;
    vec4 backgroundColor = vec4(101.f, 194.f, 245.f, 256.f)/256.f;
    uv += 0.5;

    // mouseUV *= 2.0;
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    // https://www.shadertoy.com/view/4sj3WK
	// Camera (My own attempt of preparing a camera. Use at your own risk!)
	vec3 ro = vec3( 50000.0, 0.0, 0.0); // origin
    float cTheta = polardir.x;
    float cPhi   = polardir.y;
    vec3 cDir, cU, cV;
	findUV(cTheta, cPhi, cDir, cU, cV);	

	// Tilt the camera
    float cAlpha = 0.0;
	mat3 tilt = rotationAxisAngle(CameraDirection, cAlpha);
	cU = tilt*cU; // just rotate camera U and V. Yay, tt works!
	cV = tilt*cV;	
	vec2 scan = (-1.0+2.0*uv)*vec2(1.78, 1.0); // magical numbers
	vec3 rd = normalize(scan.x * cU + scan.y * cV + FOV*CameraDirection);

    campos += ro;
    camdir = rd;
    icamdir = 1.0/camdir;

    vec3 worldorigin = vec3(0.0);
    float worldsize = 450000.0;

    // check if the ray is out of the world
    Surface world = getvox(worldorigin, worldsize*0.5);
    if(world.sd == MAXSD)
    {
        frag_color = backgroundColor;
        return;
    }

    Surface voxel = trace(worldorigin, worldsize, 0);

    if(voxel.sd < MAXSD)
    {
        //// cool depth visualisation
        // r = uint(voxel.sd/512.0);
        // g = 175;
        // b = 175;
        // vec3 vcol = hsv2rgb(vec3(float(r), float(g), float(b))/256.0);

        #ifdef GETVOX_VISUALIZATION
        //// getvoxls calls vizualisation
        // uint r = getvoxcnt;
        // uint g = 175;
        // uint b = 175;
        uint r = 0;
        uint g = 0;
        uint b = getvoxcnt;
        vec3 vcol = hsv2rgb(vec3(float(r), float(g), float(b))/256.0);
        #else
        
        //// getting voxel color
        uint r = (voxel.col>>uint(16))%uint(256);
        uint g = (voxel.col>>uint(8))%uint(256);
        uint b = (voxel.col)%uint(256);
        vec3 vcol = vec3(float(r), float(g), float(b))/256.0;
        #endif

        frag_color.rgb = vcol;

        vec3 voxside_colodr = vec3(0.85, 1.0, 0.75);
        switch(voxel.side)
        {
            case voxside_x : frag_color *= voxside_colodr.x; break;
            case voxside_y : frag_color *= voxside_colodr.y; break;
            case voxside_z : frag_color *= voxside_colodr.z; break;
        }

    }
    else
    {
        frag_color = backgroundColor;
        
        #ifdef GETVOX_VISUALIZATION
        // uint r = getvoxcnt;
        // uint g = 175;
        // uint b = 175;
        uint r = 0;
        uint g = 0;
        uint b = getvoxcnt;
        vec3 vcol = hsv2rgb(vec3(float(r), float(g), float(b))/256.0);
        frag_color.rgb = vcol;
        #endif
    }

    // campos += camdir*voxel.sd;
    // camdir = normalize(vec3(0.5, 0.1, 0.5));
    // Surface shadow = trace(worldorigin, worldsize, 0);
    // if(shadow.sd < MAXSD)
    //     frag_color *= 0.25;

    frag_color.a = 1.0;
}
#version 450

// #define GETVOX_VISUALIZATION
// #define DEBUG_FRACTAL
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
    else 
        return return_val;
    
    if(return_val.sd == tx1 || return_val.sd == tx2)
        return_val.side = voxside_x;

    if(return_val.sd == ty1 || return_val.sd == ty2)
        return_val.side = voxside_y;

    if(return_val.sd == tz1 || return_val.sd == tz2)
        return_val.side = voxside_z;

    return return_val;
}


Surface trace_no_sort(vec3 origin, float size, int depth)
{
    int i[MAX_OCTDEPTH+1];
    uint n[MAX_OCTDEPTH+1];
    vec3 o[MAX_OCTDEPTH+1];

    Surface voxel;
    voxel.sd = MAXSD;

    i[0] = 0;
    o[0] = origin;
    n[0] = 0;

    size *= 0.5;

    int id = 0;

    // for(i[depth] = 0; i[0] < 8; i[depth]++)
    while(i[0] < 8)
    {
        id = i[depth];

        // GENERATE ORIGIN 
        vec3 msign = vec3(-0.5);
        if((id&1) == 1) msign.z = 0.5;
        if((id&2) == 2) msign.y = 0.5;
        if((id&4) == 4) msign.x = 0.5;
        vec3 so = o[depth] + msign*size;

        // GENERATE SUBVOXEL
        Surface subvoxel = getvox(so, size*0.5);

        // BRANCHING TO THE LOWER DEPTH
    #ifdef DEBUG_FRACTAL
        if(subvoxel.sd < voxel.sd)
        {
            uint ptr = uint(World[0].childs[id]);

            if(depth == MAX_OCTDEPTH)
            {
                voxel.sd = subvoxel.sd;
                voxel.col = 0x00FFFF00;
            }
            else if(id <= 6)
            {
                size *= 0.5;
                depth++;
                o[depth] = so;
                n[depth] = ptr;
                i[depth] = 0;
            }
        }
    #else
        if(subvoxel.sd < MAXSD)
        {
            uint ptr = uint(World[n[depth]].childs[id]);

            if(ptr >= LEAF_LIMIT && subvoxel.sd < voxel.sd)
            {
                voxel = subvoxel;
                voxel.col = ptr&0x00FFFFFF;
            }
            else if(ptr != 0)
            {
                size *= 0.5;
                depth++;
                o[depth] = so;
                n[depth] = ptr;
                i[depth] = -1;
            }
            else if(depth == MAX_OCTDEPTH && subvoxel.sd < voxel.sd)
            {
                voxel.sd = subvoxel.sd;
                voxel.col = World[n[depth]].col;
            }
        }
    #endif

        // BRANCHING TO THE HIGHER DEPTH
        while(depth > 0 && i[depth] > 7)
        {
            depth--;
            size *= 2.0;
        }
        
        i[depth] ++;
    }


    return voxel;
}

struct sort_subvoxl
{
    Surface  surface;
    lowp int id;
};

vec3 get_origin(lowp int id, float size, vec3 o)
{
    switch ( id ) 
    {
        case 0 : return vec3(o.x - size, o.y - size, o.z - size);
        case 1 : return vec3(o.x - size, o.y - size, o.z + size);
        case 2 : return vec3(o.x - size, o.y + size, o.z - size);
        case 3 : return vec3(o.x - size, o.y + size, o.z + size);
        case 4 : return vec3(o.x + size, o.y - size, o.z - size);
        case 5 : return vec3(o.x + size, o.y - size, o.z + size);
        case 6 : return vec3(o.x + size, o.y + size, o.z - size);
        case 7 : return vec3(o.x + size, o.y + size, o.z + size);
    }

    return o;
}

Surface trace(vec3 origin, float size, int depth)
{
    lowp int  i[MAX_OCTDEPTH+1];
    uint n[MAX_OCTDEPTH+1];
    vec3 o[MAX_OCTDEPTH+1];
    sort_subvoxl s[MAX_OCTDEPTH+1][4];

    Surface voxel;
    voxel.sd = MAXSD;

    i[0] = -1;
    n[0] = 0;
    o[0] = origin;

    int cnt;

    sort_subvoxl tmp;

    size *= 0.25;

    while(i[0] < 4)
    {
        // CREATING SUBVOXELS FOR THIS DEPTH
        if(i[depth] == -1)
        {
            // INITIALAZING SUBVOXELS
            s[depth][0].surface.sd = MAXSD;
            s[depth][1].surface.sd = MAXSD;
            s[depth][2].surface.sd = MAXSD;
            s[depth][3].surface.sd = MAXSD;
            cnt = 0;

            // GENERATING SUBVOXELS
            for(int j = 0; j < 8 && cnt < 4; j++)
            {
                // GENERATING ORIGIN 
                vec3 so = get_origin(j, size, o[depth]);

                // TESTING COLLISION
                Surface t = getvox(so, size);

            #ifdef DEBUG_FRACTAL
                if(t.sd < MAXSD && j <= 6)
            #else
                if(t.sd < MAXSD && World[n[depth]].childs[j] != 0)
            #endif
                {
                    s[depth][cnt].surface = t;
                    s[depth][cnt].id = j;
                    cnt++;
                }
            }

            // SORTING SUBVOXELS 
            if(s[depth][0].surface.sd > s[depth][1].surface.sd) {tmp = s[depth][0]; s[depth][0] = s[depth][1]; s[depth][1] = tmp;}
            if(s[depth][2].surface.sd > s[depth][3].surface.sd) {tmp = s[depth][2]; s[depth][2] = s[depth][3]; s[depth][3] = tmp;}
            if(s[depth][0].surface.sd > s[depth][2].surface.sd) {tmp = s[depth][0]; s[depth][0] = s[depth][2]; s[depth][2] = tmp;}
            if(s[depth][1].surface.sd > s[depth][3].surface.sd) {tmp = s[depth][1]; s[depth][1] = s[depth][3]; s[depth][3] = tmp;}
            if(s[depth][1].surface.sd > s[depth][2].surface.sd) {tmp = s[depth][1]; s[depth][1] = s[depth][2]; s[depth][2] = tmp;}
        
            i[depth] = 0;
        }

        // CHECKING SUBVOXELS 
        for(; i[depth] < 4; i[depth]++)
        {
            lowp int j = i[depth];
            if(s[depth][j].surface.sd < MAXSD)
            {
                // INFINITE LOOP SECURITY
                if(depth >= MAX_OCTDEPTH)
                {
                    voxel = s[depth][j].surface;

                #ifdef DEBUG_FRACTAL
                    voxel.col = 0x0000FFFF;
                #else 
                    voxel.col = World[n[depth]].col;
                #endif
                    return voxel;
                }

                // GETING VOXEL/NODE POINTER FROM THE WORLD
            #ifdef DEBUG_FRACTAL
                uint ptr = 0x0000FFFF;    
            #else
                uint ptr = World[n[depth]].childs[s[depth][j].id];
            #endif

                // LEAF CHECKING
                if(ptr >= LEAF_LIMIT)
                {
                    voxel = s[depth][j].surface;

                    voxel.col = ptr;
                    return voxel;
                }
                
                // BRANCHING TO THE HIGHER DEPTH
                i[depth] ++;
                depth ++;
                i[depth] = -1;
                n[depth] = ptr;
                o[depth] = get_origin(s[depth-1][j].id, size, o[depth-1]);
                size *= 0.5;

                break;
            }
        }

        // BRANCHING TO THE LOWER DEPTH
        if(depth > 0 && i[depth] >= 4)
        {
            depth --;
            size *= 2.0;
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
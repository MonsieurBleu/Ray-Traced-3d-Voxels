#ifndef VECTORS_HPP
#define VECTORS_HPP

template <typename T>
struct vec3
{
    T x, y, z;

    vec3<T>(T x, T y, T z) : x(x), y(y), z(z){};
    vec3<T>(T w) : x(w), y(w), z(w){};

    template <typename O>
    vec3<T>& operator=(vec3<O> &v)
    {
        x = (T)v.x; y = (T)v.y; z = (T)v.z;
        return *this;
    };
};

// Compute the cross value between 2 vectors 
// Use the 0 origin formula
// cx = aybz − azby
// cy = azbx − axbz
// cz = axby − aybx
template <typename T, typename O>
vec3<T> ocross(const vec3<T> &a, const vec3<O> &b)
{
    return vec3(a.y*b.z - a.z*b.y, a.z*b.x - a.x*b.z, a.x*b.y - a.y*b.x);
}



template <typename T>
std::ostream& operator<<(std::ostream& os, const vec3<T>& u)
{
    os << "vec3(" << u.x << ", " << u.y << ", " << u.z << ")";
    return os;
};

template <typename T, typename O>
vec3<T> operator+(vec3<T> u, const vec3<O> &v)
{
    u.x += (T)v.x; u.y += (T)v.y; u.z += (T)v.z; return u;
}

template <typename T, typename O>
vec3<T> operator-(vec3<T> u, const vec3<O> &v)
{
    u.x -= (T)v.x; u.y -= (T)v.y; u.z -= (T)v.z; return u;
};

template <typename T, typename O>
vec3<T> operator*(vec3<T> u, const vec3<O> &v)
{
    u.x *= (T)v.x; u.y *= (T)v.y; u.z *= (T)v.z; return u;
};

template <typename T, typename O>
vec3<T> operator/(vec3<T> u, const vec3<O> &v)
{
    u.x /= (T)v.x; u.y /= (T)v.y; u.z /= (T)v.z; return u;
};


template <typename T, typename O, typename = typename std::enable_if<std::is_arithmetic<O>::value>::type>
vec3<T> operator+(vec3<T> u, O s)
{
    u.x += (T)s; u.y += (T)s; u.z += (T)s; return u;
}

template <typename T, typename O, typename = typename std::enable_if<std::is_arithmetic<O>::value>::type>
vec3<T> operator-(vec3<T> u, O s)
{
    u.x -= (T)s; u.y -= (T)s; u.z -= (T)s; return u;
}

template <typename T, typename O, typename = typename std::enable_if<std::is_arithmetic<O>::value>::type>
vec3<T> operator*(vec3<T> u, O s)
{
    u.x *= (T)s; u.y *= (T)s; u.z *= (T)s; return u;
}

template <typename T, typename O, typename = typename std::enable_if<std::is_arithmetic<O>::value>::type>
vec3<T> operator/(vec3<T> u, O s)
{
    u.x /= (T)s; u.y /= (T)s; u.z /= (T)s; return u;
}

#endif